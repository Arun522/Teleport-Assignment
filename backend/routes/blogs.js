// backend/routes/blogs.js
const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const User = require('../models/User');
const auth = require('../middleware/auth');
const geoip = require('geoip-lite');

// Middleware to get user's location from IP
const getLocation = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
  req.userLocation = geo ? geo.country : 'Unknown';
  next();
};

// Create a new blog post
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const blog = new Blog({
      title,
      content,
      author: req.user.id,
      location: req.user.location,
    });
    await blog.save();
    console.log("Hi")
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog post', error: error.message });
  }
});

// Get all blog posts (with optional location filtering)
router.get('/', getLocation, async (req, res) => {
  try {
    const { location } = req.query;
    const filter = location ? { location } : { location: req.userLocation };
    const blogs = await Blog.find(filter).populate('author', 'username');
    console.log({blogs})
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog posts', error: error.message });
  }
});

// Get a single blog post by ID
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'username');
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog post', error: error.message });
  }
});

// Update a blog post
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this blog post' });
    }

    blog.title = title;
    blog.content = content;
    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog post', error: error.message });
  }
});

// Delete a blog post
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to delete this blog post' });
    }

    await blog.remove();
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog post', error: error.message });
  }
});

module.exports = router;