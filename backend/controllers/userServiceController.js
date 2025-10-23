import Service from "../models/serviceModel.js";
import Vendor from "../models/vendorModel.js";


// Get all services with search, filters, and pagination
export const getServices = async (req, res) => {
  try {
    const { q, servicetype, location } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const skip = (page - 1) * limit;

    let data = [];
    let totalResults = 0;

    // ✅ If filtering specifically for drivers
    if (servicetype === "driver") {
      const driverFilter = {
        VendorType: "driver",
        approvedStatus: "approved",
        status: "active"
      };

      if (location) driverFilter.businessAddress = { $regex: location, $options: "i" };
      if (q) {
        driverFilter.$or = [
          { vendorName: { $regex: q, $options: "i" } },
          { businessName: { $regex: q, $options: "i" } },
          { "carDetails.carModel": { $regex: q, $options: "i" } },
        ];
      }

      totalResults = await Vendor.countDocuments(driverFilter);
      data = await Vendor.find(driverFilter)
        .select("-password -googleID -email -phone -bankDetails -license -passport -address")
        .skip(skip)
        .limit(limit);

    }
    // ✅ If filtering for other service types (NOT driver)
    else if (servicetype && servicetype !== "driver") {
      const serviceFilter = {
        approvedStatus: "approved",
        isAvailable: true,
        serviceType: servicetype
      };

      if (location) serviceFilter.location = location;
      if (q) {
        serviceFilter.$or = [
          { serviceName: { $regex: q, $options: "i" } },
          { vendorName: { $regex: q, $options: "i" } },
          { location: { $regex: q, $options: "i" } },
        ];
      }

      totalResults = await Service.countDocuments(serviceFilter);
      data = await Service.find(serviceFilter).skip(skip).limit(limit);

    }
    // ✅ Default case: fetch ALL services (all service types) + drivers
    else {
      // Fetch Services with filters (if any)
      let serviceFilter = { approvedStatus: "approved", isAvailable: true };

      if (location) serviceFilter.location = location;
      if (q) {
        serviceFilter.$or = [
          { serviceName: { $regex: q, $options: "i" } },
          { vendorName: { $regex: q, $options: "i" } },
          { location: { $regex: q, $options: "i" } },
        ];
      }

      const [services, drivers, serviceCount] = await Promise.all([
        Service.find(serviceFilter).skip(skip).limit(limit),
        Vendor.find({
          VendorType: "driver",
          approvedStatus: "approved",
          status: "active"
        }).select("-password -googleID -email -phone -bankDetails -license -passport -address"),
        Service.countDocuments(serviceFilter)
      ]);

      // Combine and shuffle services + drivers
      data = [...services, ...drivers].sort(() => Math.random() - 0.5);
      totalResults = serviceCount + drivers.length;
    }

    res.status(200).json({
      status: "success",
      query: q || null,
      filter: servicetype || null,
      currentPage: page,
      totalPages: Math.ceil(totalResults / limit),
      results: data.length,
      totalResults,
      data: data,
    });

  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


// Fetch a single service by ID
export const getServiceById = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (service) {
      if (service.approvedStatus !== "approved") {
        return res.status(404).json({
          status: "fail",
          message: "Service not found"
        });
      }
    } else {
      service = await Vendor.findById(req.params.id)
        .select("-password -googleID -email -phone -bankDetails -license -passport -address")

      if (!service) {
        return res.status(400).json({
          message: "service or vendor not found",
        });
      }
    }
    res.status(200).json({
      status: "success",
      data: service,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


