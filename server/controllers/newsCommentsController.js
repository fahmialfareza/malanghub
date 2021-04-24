const { newsComment, user } = require("../models");

class NewsCommentsController {
  async getCommentsByNews(req, res) {
    try {
      let data = await newsComment
        .find({ news: req.params.id })
        .sort({ updated_at: -1 })
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate({
          path: "commentReplies.user",
          select: "-password -role",
        });

      return res.status(200).json({ data });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async createComment(req, res) {
    try {
      let data = await newsComment.create({
        news: req.params.id,
        user: req.user.id,
        comment: req.body.comment,
      });

      data.user = await user
        .findOne({ _id: data.user })
        .select("-password -role");

      res.status(201).json({ data });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  async createCommentByComment(req, res) {
    try {
      let dataComment = await newsComment.findOne({
        _id: req.params.id,
      });

      let data = await newsComment
        .findOneAndUpdate(
          { _id: req.params.id },
          {
            $push: {
              commentReplies: {
                user: req.user.id,
                comment: req.body.comment,
              },
            },
          },
          { new: true }
        )
        .populate({
          path: "user",
          select: "-password -role",
        })
        .populate({
          path: "commentReplies.user",
          select: "-password -role",
        });

      res.status(201).json({ data });
    } catch (e) {
      console.error(e);

      return res.status(500).json({ message: e.message });
    }
  }
}

module.exports = new NewsCommentsController();
