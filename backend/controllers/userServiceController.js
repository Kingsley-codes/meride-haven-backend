import Service from "../models/serviceModel.js";


// Get all services with pagination
export const getAllServices = async (req, res) => {
  try {
    // Query params: ?page=1
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const skip = (page - 1) * limit;

    // Count total services for pagination info
    const totalServices = await Service.countDocuments({
      approvedStatus: "approved",
      isavailable: true,
    });

    const services = await Service.find({
      approvedStatus: "approved",
      isavailable: true,
    })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: "success",
      currentPage: page,
      totalPages: Math.ceil(totalServices / limit),
      results: services.length,
      totalResults: totalServices,
      data: services,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


// Fetch a single service by ID
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service || service.approvedStatus !== "approved") {
      return res.status(404).json({ status: "fail", message: "Service not found" });
    }

    res.status(200).json({
      status: "success",
      data: service,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


// Fetch services by service type only
export const getServicesByType = async (req, res) => {
  try {
    const { servicetype } = req.query; 

    if (!servicetype) {
      return res.status(400).json({
        status: "fail",
        message: "Service type is required",
      });
    }

    const services = await Service.find({
      servicetype,
    //   approvedStatus: "approved",
    //   isavailable: true,
    });

    res.status(200).json({
      status: "success",
      results: services.length,
      data: services,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


// Search services with pagination
export const searchServices = async (req, res) => {
  try {
    const { q } = req.query; // search query
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        status: "fail",
        message: "Search query (q) is required",
      });
    }

    // Case-insensitive regex search
    const searchFilter = {
      approvedStatus: "approved",
      isavailable: true,
      $or: [
        { serviceName: { $regex: q, $options: "i" } },
        { vendorName: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ],
    };

    const totalResults = await Service.countDocuments(searchFilter);

    const services = await Service.find(searchFilter)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: "success",
      query: q,
      currentPage: page,
      totalPages: Math.ceil(totalResults / limit),
      results: services.length,
      totalResults,
      data: services,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
