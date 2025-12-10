/**
 * FILE UPLOAD MANAGER - Handles image uploads with validation
 */

window.fileUpload = {
    config: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        uploadDir: 'images/'
    },

    // Validate file before upload
    validateFile: function(file) {
        const errors = [];

        // Check file size
        if (file.size > this.config.maxSize) {
            errors.push(`File too large. Max size: ${this.config.maxSize / 1024 / 1024}MB`);
        }

        // Check file type
        if (!this.config.allowedTypes.includes(file.type)) {
            errors.push(`Invalid file type. Allowed: PNG, JPG, WebP`);
        }

        // Check file name
        if (!file.name.match(/\.[a-z0-9]+$/i)) {
            errors.push('Invalid file name');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    // Sanitize file name
    sanitizeFileName: function(fileName) {
        return fileName
            .toLowerCase()
            .replace(/[^a-z0-9\-_.]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '');
    },

    // Upload file via FormData
    uploadFile: async function(file, onProgress = null) {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('sanitized_name', this.sanitizeFileName(file.name));

            const xhr = new XMLHttpRequest();

            // Progress tracking
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }

            return new Promise((resolve, reject) => {
                xhr.addEventListener('load', function() {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (err) {
                            reject(new Error('Invalid server response'));
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload aborted'));
                });

                xhr.open('POST', 'upload-image.php');
                xhr.send(formData);
            });

        } catch (err) {
            return {
                success: false,
                error: err.message
            };
        }
    },

    // Convert file to data URL (for preview or local storage)
    fileToDataURL: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    },

    // Get image path (local or URL)
    getImagePath: function(fileName, useLocal = true) {
        if (useLocal) {
            return `${this.config.uploadDir}${fileName}`;
        }
        return fileName; // Assume external URL
    }
};
