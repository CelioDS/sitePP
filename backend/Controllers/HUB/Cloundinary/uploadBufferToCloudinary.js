import cloudinary from "../../../cloundinary.js";

export function uploadBufferToCloudinary(
  fileBuffer,
  folder = "suporte_comercial",
) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
}
