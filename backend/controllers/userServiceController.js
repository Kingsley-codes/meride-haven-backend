import Service from "../models/serviceModel";

// Get all services
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({
      approvedStatus: "approved",
      isavailable: true,
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