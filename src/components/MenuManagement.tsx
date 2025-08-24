import React, { useState, useEffect } from 'react';
import { networkAdapter } from '../network/NetworkAdapter';
import { MenuItem } from '../utils/searchUtils';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

interface MenuItemForm {
  name: string;
  size: string;
  price: string;
}

interface ImageUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface MenuManagementProps {
  onClose?: () => void;
}

const MenuManagement: React.FC<MenuManagementProps> = ({ onClose }) => {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemForm>({
    name: '',
    size: '',
    price: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<MenuItemForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUpload, setImageUpload] = useState<ImageUploadState>({
    isUploading: false,
    progress: 0,
    error: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemoveImage, setItemToRemoveImage] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await networkAdapter.get('/menu_items');
      if (response && response.data && response.data.menu_items) {
        setItems(response.data.menu_items);
        setError(null);
      } else if (response && response.menu_items) {
        // Fallback for old response format
        setItems(response.menu_items);
        setError(null);
      } else {
        setError('Failed to fetch menu items');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (data: MenuItemForm): Partial<MenuItemForm> => {
    const errors: Partial<MenuItemForm> = {};

    if (!data.name.trim()) {
      errors.name = 'Name is required';
    } else if (data.name.length > 50) {
      errors.name = 'Name must be 50 characters or less';
    }

    if (!data.size.trim()) {
      errors.size = 'Size is required';
    }

    if (!data.price.trim()) {
      errors.price = 'Price is required';
    } else {
      const priceNumber = parseFloat(data.price);
      if (isNaN(priceNumber) || priceNumber <= 0) {
        errors.price = 'Price must be a positive number';
      }
    }

    return errors;
  };

  const handleInputChange = (field: keyof MenuItemForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const itemData = {
        name: formData.name.trim(),
        size: formData.size.trim(),
        price: parseFloat(formData.price)
      };

      if (editingItem) {
        // Update existing item
        await networkAdapter.put(`/menu_items/${editingItem.id}`, itemData);
      } else {
        // Create new item
        await networkAdapter.post('/menu_items', itemData);
      }

      await fetchMenuItems();
      handleCloseForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await networkAdapter.delete(`/menu_items/${item.id}`);
      await fetchMenuItems();
    } catch (err: any) {
      setError(err.message || 'Failed to delete menu item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      size: item.size,
      price: item.price.toString()
    });
    setFormErrors({});
    setImageUpload({ isUploading: false, progress: 0, error: null });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ name: '', size: '', price: '' });
    setFormErrors({});
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({ name: '', size: '', price: '' });
    setFormErrors({});
    setImageUpload({ isUploading: false, progress: 0, error: null });
    setShowForm(true);
  };


  const handleRemoveImage = (item: MenuItem) => {
    setItemToRemoveImage(item);
    setShowRemoveModal(true);
  };

  const confirmRemoveImage = async () => {
    if (!itemToRemoveImage) return;

    try {
      await networkAdapter.removeMenuItemImage(itemToRemoveImage.id);
      await fetchMenuItems();
      
      // Update editing item if it's the same item
      if (editingItem && editingItem.id === itemToRemoveImage.id) {
        setEditingItem({ ...editingItem, imageUrl: null });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove image');
    } finally {
      setShowRemoveModal(false);
      setItemToRemoveImage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!editingItem) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await uploadImageForEdit(imageFile);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (!editingItem) return;

    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        await uploadImageForEdit(file);
      }
    }
  };

  const handleModalFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingItem) return;

    await uploadImageForEdit(file);
  };

  const uploadImageForEdit = async (file: File) => {
    if (!editingItem) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageUpload(prev => ({ ...prev, error: 'Please select a valid image file (JPG, PNG, GIF, WebP)' }));
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setImageUpload(prev => ({ ...prev, error: 'File size must be less than 10MB' }));
      return;
    }

    try {
      setImageUpload({ isUploading: true, progress: 0, error: null });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('menu_item_id', editingItem.id);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setImageUpload(prev => ({ ...prev, progress: percentComplete }));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setImageUpload({ isUploading: false, progress: 100, error: null });
          
          // Update the editing item with new image URL
          const updatedItem = { ...editingItem, imageUrl: response.data.image_url };
          setEditingItem(updatedItem);
          
          // Refresh menu items to show updated image
          await fetchMenuItems();
          
          // Clear upload state after a short delay
          setTimeout(() => {
            setImageUpload({ isUploading: false, progress: 0, error: null });
          }, 2000);
        } else {
          const error = JSON.parse(xhr.responseText);
          setImageUpload(prev => ({ 
            ...prev, 
            isUploading: false, 
            error: error.errors?.[0] || 'Upload failed' 
          }));
        }
      };

      xhr.onerror = () => {
        setImageUpload(prev => ({ 
          ...prev, 
          isUploading: false, 
          error: 'Network error occurred' 
        }));
      };

      xhr.open('POST', 'http://localhost:8880/upload/image');
      xhr.send(formData);

    } catch (err: any) {
      setImageUpload(prev => ({ 
        ...prev, 
        isUploading: false, 
        error: err.message || 'Upload failed' 
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
        <div className="flex gap-2">
          {hasPermission('menu.create') && (
            <button
              onClick={handleAddNew}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4"
            onPaste={handlePaste}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            
            <div className="flex gap-6">
              {/* Left side - Form */}
              <div className="flex-1">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Cappuccino"
                      maxLength={50}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size *
                    </label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        formErrors.size ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Medium, Large"
                    />
                    {formErrors.size && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.size}</p>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price * (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        formErrors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {formErrors.price && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                    )}
                  </div>
                </form>
              </div>

              {/* Right side - Image Upload */}
              {editingItem && (
                <div className="w-64">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Item Image</h4>
                  
                  {imageUpload.error && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                      {imageUpload.error}
                    </div>
                  )}

                  {/* Current Image */}
                  <div className="mb-4">
                    {editingItem.imageUrl ? (
                      <div className="relative">
                        <img 
                          src={`http://localhost:8880${editingItem.imageUrl}`}
                          alt={editingItem.name}
                          className="w-full h-32 object-cover rounded-md border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(editingItem)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs text-gray-500">No image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {imageUpload.isUploading && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Uploading...</span>
                        <span className="text-xs text-gray-600">{Math.round(imageUpload.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-orange-500 h-1 rounded-full transition-all duration-300" 
                          style={{ width: `${imageUpload.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Upload Area */}
                  <div className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
                    isDragging 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleModalFileSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={imageUpload.isUploading}
                    />
                    <label 
                      htmlFor="image-upload" 
                      className="cursor-pointer block"
                    >
                      <svg className="mx-auto h-6 w-6 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs text-gray-600 mb-1">
                        Click to upload, drag & drop, or paste
                      </p>
                      <p className="text-xs text-gray-400">
                        JPG, PNG, GIF, WebP (max 10MB)
                      </p>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Table */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Image</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {item.imageUrl ? (
                        <div className="relative">
                          <img 
                            src={`http://localhost:8880${item.imageUrl}`}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-md border border-gray-200"
                          />
                          {hasPermission('menu.edit') && (
                            <button
                              onClick={() => handleRemoveImage(item)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                              title="Remove image"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-gray-600">{item.size}</td>
                  <td className="py-3 px-4 text-gray-600">€{item.price.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      {hasPermission('menu.edit') && (
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {hasPermission('menu.delete') && (
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Delete item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="font-semibold">No menu items found</p>
              <p className="text-sm">Get started by adding your first menu item</p>
            </div>
          )}
        </div>
      </div>

      {/* Remove Image Confirmation Modal */}
      {showRemoveModal && itemToRemoveImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-center mb-2">Remove Image</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to remove the image from <span className="font-medium">"{itemToRemoveImage.name}"</span>? This action cannot be undone.
            </p>
            
            {itemToRemoveImage.imageUrl && (
              <div className="mb-4 flex justify-center">
                <img 
                  src={`http://localhost:8880${itemToRemoveImage.imageUrl}`}
                  alt={itemToRemoveImage.name}
                  className="w-24 h-24 object-cover rounded-md border border-gray-200"
                />
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveImage}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Remove Image
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MenuManagement;