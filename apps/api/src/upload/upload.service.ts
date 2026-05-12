import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  uploadBuffer(
    buffer: Buffer,
    mimetype: string,
    folder: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: 'image' }, (err, result) => {
          if (err) return reject(new Error(err.message));
          if (!result) return reject(new Error('Upload failed'));
          resolve(result.secure_url);
        })
        .end(buffer);
    });
  }
}
