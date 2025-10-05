const userService = require("../services/userService");

// list of users

async function getUsers(req, res, next) {
  try {
    const pageValue = req.query.page || 1;
    const limitValue = req.query.limit || 10;
  const { name, email, phone, sortField, sortOrder } = req.query;

  const page = parseInt(pageValue, 10);
  const limit = parseInt(limitValue, 10);

  const users = await userService.getUsers({
    page,
    limit,
    filters: { name, email, phone },
    sort: {
      field: sortField,
      order: sortOrder,
    },
  });

    if (!users || !users.data) {
      return res.json({
        data: [],
        pagination: {
          page,
          limit,
          totalItems: 0,
          totalPages: 1,
        },
      });
    }

    res.json(users);
  } catch (error) {
    console.error("Error in getUsers controller:", error);
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);

    res.json({
      data: [],
      pagination: {
        page,
        limit,
        totalItems: 0,
        totalPages: 1,
      },
    });
  }
}

/**
 * Create or update a user
 * Auto-detect shared attributes and create relationships
 */
async function createOrUpdateUser(req, res, next) {
  try {
    const userData = req.body;
    const result = await userService.createOrUpdateUser(userData);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get user by ID
 */
async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  createOrUpdateUser,
  getUserById,
};
