import Service from "../models/serviceModel.js";
import Vendor from "../models/vendorModel.js";


// Get all services with search, filters, and pagination
export const getServices = async (req, res) => {
  try {
    const { q, servicetype, location } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 24;
    const skip = (page - 1) * limit;

    let services = [];
    let drivers = [];

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

      const totalResults = await Vendor.countDocuments(driverFilter);
      const driverData = await Vendor.find(driverFilter)
        .select("-password -googleID -email -phone -bankDetails -license -passport -address")
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        status: "success",
        query: q || null,
        currentPage: page,
        totalPages: Math.ceil(totalResults / limit),
        results: driverData.length,
        totalResults,
        data: driverData, // ✅ Only drivers here
      });
    }

    // ✅ Fetch Services if servicetype is NOT "driver"
    let serviceFilter = { approvedStatus: "approved", isAvailable: true };

    if (servicetype) serviceFilter.serviceType = servicetype;
    if (location) serviceFilter.location = location;
    if (q) {
      serviceFilter.$or = [
        { serviceName: { $regex: q, $options: "i" } },
        { vendorName: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ];
    }

    const totalServiceResults = await Service.countDocuments(serviceFilter);
    services = await Service.find(serviceFilter).skip(skip).limit(limit);

    // ✅ Fetch Drivers (only those approved and active)
    drivers = await Vendor.find({
      VendorType: "driver",
      approvedStatus: "approved",
      status: "active"
    })
      .select("-password -googleID -email -phone -bankDetails -license -passport -address");

    // ✅ Merge and shuffle services + drivers
    const combined = [...services, ...drivers].sort(() => Math.random() - 0.5);

    res.status(200).json({
      status: "success",
      query: q || null,
      filter: servicetype || null,
      currentPage: page,
      totalPages: Math.ceil(totalServiceResults / limit),
      results: combined.length,
      totalResults: totalServiceResults + drivers.length,
      data: combined,
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


