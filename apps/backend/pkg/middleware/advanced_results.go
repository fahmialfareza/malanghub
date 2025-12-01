package middleware

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/fahmialfareza/malanghub/backend/pkg/db"
)

// AdvancedResults returns a middleware that performs filtering, sorting and pagination
// for the given collection name and stores the results in the context under "advancedResults".
func AdvancedResults(collection string) gin.HandlerFunc {
	return func(c *gin.Context) {
		coll := db.GetCollection(collection)
		if coll == nil {
			c.Next()
			return
		}

		// pagination
		page := 1
		limit := 20
		if p := c.Query("page"); p != "" {
			if v, err := strconv.Atoi(p); err == nil && v > 0 {
				page = v
			}
		}
		if l := c.Query("limit"); l != "" {
			if v, err := strconv.Atoi(l); err == nil && v > 0 {
				limit = v
			}
		}
		skip := (page - 1) * limit

		// projection
		proj := bson.M{}
		if sel := c.Query("select"); sel != "" {
			fields := strings.Split(sel, ",")
			for _, f := range fields {
				proj[strings.TrimSpace(f)] = 1
			}
		}

		// sort
		sortDoc := bson.D{}
		if s := c.Query("sort"); s != "" {
			parts := strings.Split(s, ",")
			for _, p := range parts {
				p = strings.TrimSpace(p)
				if p == "" {
					continue
				}
				if strings.HasPrefix(p, "-") {
					sortDoc = append(sortDoc, bson.E{Key: p[1:], Value: -1})
				} else {
					sortDoc = append(sortDoc, bson.E{Key: p, Value: 1})
				}
			}
		} else {
			// default sort
			sortDoc = append(sortDoc, bson.E{Key: "created_at", Value: -1})
		}

		// base filter: not deleted (handles null/missing as non-deleted) and approved
		filter := bson.M{"approved": true, "$or": bson.A{
			bson.M{"deleted": false},
			bson.M{"deleted": bson.M{"$exists": false}},
		}}

		// Track if this is myNews to prevent query param override
		isMyNews := strings.Contains(c.Request.RequestURI, "/myNews") || strings.Contains(c.Request.URL.Path, "/myNews")

		// If on /myNews route, automatically filter by current user (still approved)
		if isMyNews {
			if userIDVal, ok := c.Get("userID"); ok {
				if userIDStr, ok := userIDVal.(string); ok {
					if userID, err := primitive.ObjectIDFromHex(userIDStr); err == nil {
						filter["user"] = userID
					}
				}
			}
		}

		// allow basic filters via query params (category, tags, user, status)
		// Skip user param if this is /myNews (already set above)
		for _, key := range []string{"category", "tags", "user", "status"} {
			if key == "user" && isMyNews {
				continue // Skip user param on /myNews
			}
			if v := c.Query(key); v != "" {
				// support comma-separated for $in
				if strings.Contains(v, ",") {
					vals := strings.Split(v, ",")
					for i := range vals {
						vals[i] = strings.TrimSpace(vals[i])
					}
					// if category/user, try converting to ObjectIDs
					if key == "category" || key == "tags" || key == "user" {
						var oids []primitive.ObjectID
						ok := true
						for _, s := range vals {
							if oid, err := primitive.ObjectIDFromHex(s); err == nil {
								oids = append(oids, oid)
							} else {
								ok = false
								break
							}
						}
						if ok {
							filter[key] = bson.M{"$in": oids}
						} else {
							filter[key] = bson.M{"$in": vals}
						}
					} else {
						filter[key] = bson.M{"$in": vals}
					}
				} else {
					// single value
					if key == "category" || key == "tags" || key == "user" {
						if oid, err := primitive.ObjectIDFromHex(strings.TrimSpace(v)); err == nil {
							filter[key] = oid
						} else {
							filter[key] = v
						}
					} else {
						filter[key] = v
					}
				}
			}
		}

		// search q param -> regex on title and content
		if q := c.Query("q"); q != "" {
			filter["$or"] = bson.A{
				bson.M{"title": bson.M{"$regex": q, "$options": "i"}},
				bson.M{"content": bson.M{"$regex": q, "$options": "i"}},
			}
		}

		// Build aggregation pipeline so we can populate related collections
		pipeline := make([]bson.M, 0)

		// match stage
		pipeline = append(pipeline, bson.M{"$match": filter})

		// sort stage
		if len(sortDoc) > 0 {
			pipeline = append(pipeline, bson.M{"$sort": sortDoc})
		}

		// pagination stages
		pipeline = append(pipeline, bson.M{"$skip": int64(skip)})
		pipeline = append(pipeline, bson.M{"$limit": int64(limit)})

		// populate related collections: category, user, tags
		// category (single ref)
		pipeline = append(pipeline, bson.M{"$lookup": bson.M{
			"from":         "newscategories",
			"localField":   "category",
			"foreignField": "_id",
			"as":           "category",
		}})
		pipeline = append(pipeline, bson.M{"$unwind": bson.M{"path": "$category", "preserveNullAndEmptyArrays": true}})

		// user (single ref)
		pipeline = append(pipeline, bson.M{"$lookup": bson.M{
			"from":         "users",
			"localField":   "user",
			"foreignField": "_id",
			"as":           "user",
		}})
		pipeline = append(pipeline, bson.M{"$unwind": bson.M{"path": "$user", "preserveNullAndEmptyArrays": true}})

		// tags (array of refs)
		pipeline = append(pipeline, bson.M{"$lookup": bson.M{
			"from":         "newstags",
			"localField":   "tags",
			"foreignField": "_id",
			"as":           "tags",
		}})

		// projection stage (if select provided)
		if len(proj) > 0 {
			pipeline = append(pipeline, bson.M{"$project": proj})
		}

		cur, err := coll.Aggregate(c, pipeline)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
		defer cur.Close(c)

		var results []bson.M
		for cur.Next(c) {
			var item bson.M
			if err := cur.Decode(&item); err == nil {
				results = append(results, item)
			}
		}

		// count total
		total, _ := coll.CountDocuments(c, filter)

		meta := bson.M{"page": page, "limit": limit, "total": total}
		c.Set("advancedResults", gin.H{"meta": meta, "data": results})
		c.Next()
	}
}
