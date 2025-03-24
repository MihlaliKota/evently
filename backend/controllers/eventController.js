const eventModel = require('../models/eventModel');
const reviewModel = require('../models/reviewModel');
const { AppError } = require('../middleware/error');
const asyncHandler = require('../utils/asyncHandler');

const eventController = {
  // Get all events
  getAllEvents: asyncHandler(async (req, res) => {
    const events = await eventModel.getAll({
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sort_by,
      sortOrder: req.query.sort_order,
      category_id: req.query.category_id
    });

    // Set pagination headers
    if (events.pagination) {
      res.set('X-Total-Count', events.pagination.total);
      res.set('X-Total-Pages', events.pagination.pages);
      res.set('X-Current-Page', events.pagination.page);
      res.set('X-Per-Page', events.pagination.limit);
    }

    res.status(200).json(events.events);
  }),

  // Get single event
  getEvent: asyncHandler(async (req, res) => {
    const event = await eventModel.getById(req.params.eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    res.status(200).json(event);
  }),

  // Create event
  createEvent: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { name, description, event_date, location, event_type, category_id } = req.body;

    if (!name || !category_id || !event_date) {
      throw new AppError('Name, category_id, and event_date are required', 400);
    }

    // Handle image upload via Cloudinary
    const imagePath = req.file ? req.file.path : null;

    const eventData = {
      user_id: userId,
      category_id,
      name: name.trim(),
      description: description ? description.trim() : null,
      event_date,
      location: location ? location.trim() : null,
      event_type,
      image_path: imagePath
    };

    const newEvent = await eventModel.create(eventData);
    res.status(201).json(newEvent);
  }),

  // Update event
  updateEvent: asyncHandler(async (req, res) => {
    const eventId = req.params.eventId;
    const { name, description, event_date, location, event_type, category_id } = req.body;

    // Handle image upload via Cloudinary
    const imagePath = req.file ? req.file.path : undefined;

    const updatedEvent = await eventModel.update(eventId, {
      name,
      description,
      event_date,
      location,
      event_type,
      category_id,
      image_path: imagePath
    });

    if (!updatedEvent) {
      throw new AppError('Event not found', 404);
    }

    if (updatedEvent.success === false) {
      throw new AppError(updatedEvent.message, 400);
    }

    res.status(200).json(updatedEvent);
  }),

  // Delete event
  deleteEvent: asyncHandler(async (req, res) => {
    const eventId = req.params.eventId;
    const deleted = await eventModel.delete(eventId);

    if (!deleted) {
      throw new AppError('Event not found', 404);
    }

    res.status(204).send();
  }),

  // Get upcoming events
  getUpcomingEvents: asyncHandler(async (req, res) => {
    const { page = 1, limit = 3, sortBy = 'event_date', sortOrder = 'asc' } = req.query;

    const events = await eventModel.getUpcomingPaginated({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    // Set pagination headers
    if (events.pagination) {
      res.set('X-Total-Count', events.pagination.total);
      res.set('X-Total-Pages', events.pagination.pages);
      res.set('X-Current-Page', events.pagination.page);
      res.set('X-Per-Page', events.pagination.limit);
    }

    res.status(200).json(events.events);
  }),

  // Get past events
  getPastEvents: asyncHandler(async (req, res) => {
    const { page = 1, limit = 3, sortBy = 'event_date', sortOrder = 'desc' } = req.query;

    const events = await eventModel.getPastPaginated({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    // Set pagination headers
    if (events.pagination) {
      res.set('X-Total-Count', events.pagination.total);
      res.set('X-Total-Pages', events.pagination.pages);
      res.set('X-Current-Page', events.pagination.page);
      res.set('X-Per-Page', events.pagination.limit);
    }

    res.status(200).json(events.events);
  }),

  // Get event reviews
  getEventReviews: asyncHandler(async (req, res) => {
    const eventId = req.params.eventId;
    const reviews = await reviewModel.getEventReviews(eventId);
    res.status(200).json(reviews);
  }),

  // Create review for event
  createReview: asyncHandler(async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const userId = req.user.userId;

      // Debug logging
      console.log('Review submission received:', {
        body: req.body,
        file: req.file ? {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path || 'no path'
        } : 'No file uploaded'
      });

      const { review_text, rating } = req.body;

      // Get the image path from the uploaded file, use null if no file
      const image_path = req.file ? req.file.path : null;

      if (!rating || rating < 1 || rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }

      // Create review with explicit parameters
      const result = await reviewModel.create({
        event_id: eventId,
        user_id: userId,
        review_text: review_text || '',
        rating: Number(rating),
        image_path
      });

      if (result.error) {
        throw new AppError(result.error, result.status);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('ERROR in createReview:', error);
      res.status(500).json({
        error: 'Server error occurred',
        details: error.message
      });
    }
  })
};

module.exports = eventController;