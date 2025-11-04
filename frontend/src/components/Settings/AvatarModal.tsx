import React, { useState } from "react";

type Props = {
  currentAvatar: string;
  onClose: () => void;
  onSave: (file: File) => void;
};

const AvatarModal: React.FC<Props> = ({ currentAvatar, onClose, onSave }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(currentAvatar);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    if (selectedFile) {
      onSave(selectedFile);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Change Profile Picture</h2>
        <div className="flex justify-center mb-4">
          <img
            src={preview}
            alt="Avatar Preview"
            className="w-32 h-32 rounded-full object-cover border shadow"
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarModal;
