export const VE_WOLRD_SCALING_FACTOR = 2.7
export const AVG_PHONE_WIDTH = 400
export const LOGO_UPLOAD_GUIDELINES =
  "Recommended size: 512x512 px. Maintain a 1:1 aspect ratio. The logo must be a full square image and they must have a background."
export const BANNER_UPLOAD_GUIDELINES = "Recommended size: 1240×460. Keep key content centered for consistent display."
export const VEWORLD_BANNER_UPLOAD_GUIDELINES = "Recommended size: 800×400. Maintain a 2:1 aspect ratio."
export const SCREENSHOT_UPLOAD_GUIDELINES = "Maintain a 9:16 aspect ratio."
export const IMAGE_REQUIREMENTS = {
  logo: {
    extension: "png",
    mimeType: "image/png",
    dimensions: {
      minWidth: 512,
      minHeight: 512,
      ratio: 1, // 1:1
      ratioString: "1:1",
    },
  },
  banner: {
    extension: "png",
    mimeType: "image/png",
    dimensions: {
      minWidth: 1240,
      minHeight: 460,
      ratio: 2.695652173913043, // 1240:460
      ratioString: "4:3",
    },
  },
  ve_world_banner: {
    extension: "png",
    mimeType: "image/png",
    dimensions: {
      minWidth: 800,
      minHeight: 400,
      ratio: 2, // 2:1
      ratioString: "2:1",
    },
  },
  screenshot: {
    extension: "png",
    mimeType: "image/png",
    dimensions: {
      minWidth: 0,
      minHeight: 0,
      ratio: 0.5625, // 9:16
      ratioString: "9:16",
    },
  },
  ve_world_featured_image: {
    extension: "png",
    mimeType: "image/png",
    dimensions: {
      minWidth: 720,
      minHeight: 720,
      ratio: 1, // 1:1
      ratioString: "1:1",
    },
  },
} as const
