import Service from "../models/serviceModel.js";


export const createEventService = async (serviceData, serviceTypeDetails) => {
    try {
        const newService = new Service(serviceData, serviceTypeDetails);
        await newService.save();
        return newService;
    } catch (error) {
        throw new Error("Error creating event service");
    }
};
