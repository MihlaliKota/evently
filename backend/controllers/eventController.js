const eventModel = require('../models/eventModel');
const reviewModel = require('../models/reviewModel');
const { AppError } = require('../middleware/error');
const asyncHandler = require('../utils/asyncHandler');

const eventController = {
  // Get all events
  getAllEvents: asyncHandler(async (req, res) => {
    const { page, limit, sort_by, sort_order, category_id } = req.query;

    // Log the incoming parameters
    console.log('getAllEvents params:', { page, limit, sort_by, sort_order, category_id });

    const events = await eventModel.getAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sortBy: sort_by,
      sortOrder: sort_order,
      category_id: category_id ? parseInt(category_id) : undefined
    });

    // Log the response structure
    console.log(`Returning ${events.events.length} events with pagination:`, events.pagination);

    // Set pagination headers
    if (events.pagination) {
      res.set('X-Total-Count', events.pagination.total.toString());
      res.set('X-Total-Pages', events.pagination.pages.toString());
      res.set('X-Current-Page', events.pagination.page.toString());
      res.set('X-Per-Page', events.pagination.limit.toString());

      // Set Access-Control-Expose-Headers to ensure CORS allows these headers to be read
      const existingExposeHeaders = res.get('Access-Control-Expose-Headers') || '';
      const headersToExpose = 'X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page';
      res.set('Access-Control-Expose-Headers',
        existingExposeHeaders ? `${existingExposeHeaders}, ${headersToExpose}` : headersToExpose
      );
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

    // Use secure_url from Cloudinary if available
    const imagePath = req.file ? req.file.path : null;

    // Log the image path for debugging
    if (imagePath) {
      console.log('Cloudinary image upload successful:', {
        originalname: req.file.originalname,
        size: req.file.size,
        path: imagePath
      });
    }

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

    // Log the incoming parameters
    console.log('getUpcomingEvents params:', { page, limit, sortBy, sortOrder });

    const events = await eventModel.getUpcomingPaginated({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    // Log the response structure
    console.log(`Returning ${events.events.length} upcoming events with pagination:`, events.pagination);

    // Set pagination headers
    if (events.pagination) {
      res.set('X-Total-Count', events.pagination.total.toString());
      res.set('X-Total-Pages', events.pagination.pages.toString());
      res.set('X-Current-Page', events.pagination.page.toString());
      res.set('X-Per-Page', events.pagination.limit.toString());

      // Set Access-Control-Expose-Headers to ensure CORS allows these headers to be read
      const existingExposeHeaders = res.get('Access-Control-Expose-Headers') || '';
      const headersToExpose = 'X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page';
      res.set('Access-Control-Expose-Headers',
        existingExposeHeaders ? `${existingExposeHeaders}, ${headersToExpose}` : headersToExpose
      );
    }

    res.status(200).json(events.events);
  }),

  // Get past events
  getPastEvents: asyncHandler(async (req, res) => {
    const { page = 1, limit = 3, sortBy = 'event_date', sortOrder = 'desc' } = req.query;

    // Log the incoming parameters
    console.log('getPastEvents params:', { page, limit, sortBy, sortOrder });

    const events = await eventModel.getPastPaginated({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    // Log the response structure
    console.log(`Returning ${events.events.length} past events with pagination:`, events.pagination);

    // Set pagination headers
    if (events.pagination) {
      res.set('X-Total-Count', events.pagination.total.toString());
      res.set('X-Total-Pages', events.pagination.pages.toString());
      res.set('X-Current-Page', events.pagination.page.toString());
      res.set('X-Per-Page', events.pagination.limit.toString());

      // Set Access-Control-Expose-Headers to ensure CORS allows these headers to be read
      const existingExposeHeaders = res.get('Access-Control-Expose-Headers') || '';
      const headersToExpose = 'X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page';
      res.set('Access-Control-Expose-Headers',
        existingExposeHeaders ? `${existingExposeHeaders}, ${headersToExpose}` : headersToExpose
      );
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
      const { review_text, rating } = req.body;

      console.log('Review submission:', {
        eventId,
        hasFile: !!req.file,
        rating
      });

      if (!rating || rating < 1 || rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }

      // Get image URL from Cloudinary
      const image_path = req.file ? req.file.path : null;

      console.log('Submitting review with image_path:', image_path);

      // Create review with all fields explicitly defined
      const result = await reviewModel.create({
        event_id: eventId,
        user_id: userId,
        review_text: review_text || '',
        rating: Number(rating),
        image_path
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('Review creation error:', error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Failed to create review',
        details: error.message
      });
    }
  })
};

module.exports = eventController;