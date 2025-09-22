import Service from "../models/serviceModel";
import Vendor from "../models/vendorModel";




export const createService = async (req, res) => {
    try {
        const { serviceName, location, description, servicetype, price } = req.body;

        const vendorID = req.vendorId;

        if (!vendorID) {
            return res.status(403).json({
                message: "You are not authorized to create service for this vendor"
            });
        }

        const vendor = await Vendor.findById(vendorID);
        if (!vendor) {
            return res.status(404).json({
                message: "Vendor not found"
            });
        }

        if (vendor.approvedStatus !== 'approved') {
            return res.status(403).json({
                message: "Vendor is not approved to create services"
            });
        }

        const newService = await Service.create({
            serviceName,
            vendorName,
            vendorId,
            location,
            description,
            servicetype,
            driver,
            price
        });

        await newService.save();
        res.status(201).json({ message: "Service created successfully", service: newService });
    } catch (error) {
        res.status(500).json({ message: "Error creating service", error: error.message });
    }
};
