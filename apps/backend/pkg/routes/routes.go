package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/fahmialfareza/malanghub/backend/controllers"
	authpkg "github.com/fahmialfareza/malanghub/backend/pkg/auth"
	"github.com/fahmialfareza/malanghub/backend/pkg/middleware"
	"github.com/fahmialfareza/malanghub/backend/pkg/validators"
)

func Register(r *gin.Engine) {
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		auth.POST("/signup", controllers.Signup)
		auth.POST("/signin", controllers.Signin)
		auth.POST("/google", controllers.GoogleSignIn)

		users := api.Group("/users")
		// Mirror original Node routes: GET /api/users returns profile when authenticated
		users.GET("", authpkg.JWTMiddleware(), controllers.GetProfile)
		users.POST("/signup", controllers.Signup)
		users.POST("/signin", controllers.Signin)
		users.POST("/google", controllers.GoogleSignIn)
		// Admin listing endpoint kept at /all
		users.GET("/all", authpkg.AdminMiddleware(), controllers.ListUsers)
		users.POST("", controllers.CreateUser)
		users.GET("/profile", authpkg.JWTMiddleware(), controllers.GetProfile)
		users.GET("/:id", controllers.GetUser)

		// news
		news := api.Group("/news")
		{
			news.GET("", middleware.AdvancedResults("news"), controllers.ListNews)
			news.GET("/myNews", authpkg.JWTMiddleware(), middleware.AdvancedResults("news"), controllers.MyNews)
			news.GET("/search", middleware.AdvancedResults("news"), controllers.ListNews)
			news.GET("/:slug", controllers.GetNewsBySlug)
			news.POST("", authpkg.JWTMiddleware(), validators.NewsCreateValidator(), controllers.CreateNews)
			news.PUT("/:id", authpkg.JWTMiddleware(), authpkg.AdminMiddleware(), validators.NewsUpdateValidator(), controllers.UpdateNews)
			news.DELETE("/:id", authpkg.JWTMiddleware(), authpkg.AdminMiddleware(), controllers.DeleteNews)
		}

		// categories
		categories := api.Group("/newsCategories")
		{
			categories.GET("", controllers.GetAllCategories)
			categories.GET("/:slug", controllers.GetCategoryBySlug)
			categories.POST("", authpkg.JWTMiddleware(), authpkg.AdminMiddleware(), validators.CategoryCreateValidator(), controllers.CreateCategory)
			categories.PUT("/:id", authpkg.JWTMiddleware(), authpkg.AdminMiddleware(), controllers.UpdateCategory)
			categories.DELETE("/:id", authpkg.JWTMiddleware(), authpkg.AdminMiddleware(), controllers.DeleteCategory)
		}

		// tags
		tags := api.Group("/newsTags")
		{
			tags.GET("", controllers.GetAllTags)
			tags.GET("/:slug", controllers.GetTagBySlug)
			tags.POST("", authpkg.JWTMiddleware(), authpkg.AdminMiddleware(), validators.TagCreateValidator(), controllers.CreateTag)
			tags.PUT("/:id", authpkg.JWTMiddleware(), authpkg.AdminMiddleware(), controllers.UpdateTag)
			tags.DELETE("/:id", authpkg.JWTMiddleware(), authpkg.AdminMiddleware(), controllers.DeleteTag)
		}

		// images (simple upload endpoint)
		images := api.Group("/upload")
		{
			images.POST("", controllers.ImageUpload)
		}

		// news drafts
		drafts := api.Group("/newsDrafts")
		{
			drafts.GET("", controllers.GetAllDrafts)
			drafts.POST("", authpkg.JWTMiddleware(), validators.NewsCreateValidator(), controllers.CreateDraft)
			drafts.GET("/myDrafts", authpkg.JWTMiddleware(), controllers.MyDrafts)
			drafts.PUT("/:id", authpkg.JWTMiddleware(), validators.NewsUpdateValidator(), controllers.UpdateDraft)
			drafts.DELETE("/:id", authpkg.JWTMiddleware(), controllers.DeleteDraft)
			drafts.GET("/:slug", controllers.GetDraftBySlug)
		}

		// comments
		comments := api.Group("/newsComments")
		{
			comments.GET("/:id", controllers.GetCommentsByNews)
			comments.POST("/:id", authpkg.JWTMiddleware(), controllers.CreateComment)
			comments.POST("/commentReply/:id", authpkg.JWTMiddleware(), controllers.CreateCommentByComment)
		}
	}
}
