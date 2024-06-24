const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.createSubSection = async (req, res) => {
try {
    // Fetch Data
    const { sectionId, title, timeDuration, description } = req.body;

    // Extract video
    const video = req.files.video;
    
    // Validation
    if(!sectionId || !title || !timeDuration || !description || !video){
        return res.status(404).json({ 
            success: false, 
            message: "All Fields are Required" 
        }); 
    };
     
    // Upload the video file to Cloudinary
    const uploadDetails = await uploadImageToCloudinary(video,  process.env.FOLDER_NAME);
    
    // Create a new sub-section with the necessary information in DB;
    const subSectionDetails = await SubSection.create({
        title: title,
        timeDuration: `${uploadDetails.duration}`,
        description: description,
        videoUrl: uploadDetails.secure_url,
    });
  
    // Update the corresponding section with the newly created sub-section
    const updatedSection = await Section.findByIdAndUpdate({ _id: sectionId },  
    {$push: 
    { 
        subSection: subSectionDetails._id 
    }}, {new: true}).populate("subSection");

    // Return response
    return res.status(200).json({ 
        success: true,
        message: 'Sub Section Created Successfully',
        data: updatedSection,
    });
    }
    catch (error){
    return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
    })
    };
};

exports.updateSubSection = async (req, res) => {
try {
    // Fetch Data
    const { sectionId,subSectionId, title, description } = req.body
    const subSection = await SubSection.findById(subSectionId)
  
    // Validate
    if(!subSection){
    return res.status(404).json({
        success: false,  
        message: "SubSection not found", 
    });
    };
  
    if(title !== undefined)
    {
        subSection.title = title
    };
  
    if(description !== undefined)
    {
        subSection.description = description
    };

    if(req.files && req.files.video !== undefined)
    {
        const video = req.files.video;
        const uploadDetails = await uploadImageToCloudinary( video, process.env.FOLDER_NAME);
        subSection.videoUrl = uploadDetails.secure_url;
        subSection.timeDuration = `${uploadDetails.duration}`;
    };
  
    await subSection.save();

    const updatedSection = await Section.findById(sectionId).populate("subSection")

    return res.json({
    success: true,
    data:updatedSection,
    message: "Section updated successfully",
    });
    }
    catch(error){
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
};

exports.deleteSubSection = async (req, res) => {
    try {
      const { subSectionId, sectionId } = req.body;
      await Section.findByIdAndUpdate( 
        { _id: sectionId },  
        {$pull: {subSection: subSectionId,},}
    );
    
    const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId });
  
    if(!subSection)
    {
        return res.status(404).json({ 
            success: false, 
            message: "SubSection not found"
        });
    }

    const updatedSection = await Section.findById(sectionId).populate("subSection");
  
    return res.json({
        success: true,
        data:updatedSection,
        message: "SubSection deleted successfully",
    });
    }
    catch(error) {
        console.error(error);
        return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
    });
    };
};