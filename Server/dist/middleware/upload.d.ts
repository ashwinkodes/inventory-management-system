import multer from 'multer';
export declare const uploadGearImage: multer.Multer;
export declare const deleteUploadedFile: (filePath: string) => void;
export declare const getFileUrl: (filename: string) => string;
