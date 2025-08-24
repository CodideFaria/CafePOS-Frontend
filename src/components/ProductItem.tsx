import React from 'react';
import beep from '../assets/beep-29.mp3';
import placeholder from '../assets/menu-item-placeholder.svg';

const ProductItem = ({ product, onSelect }: any) => {
    const imageUrl = product.imageUrl ? `http://localhost:8880${product.imageUrl}` : placeholder;
    
    return (
        <div 
            role="button" 
            onClick={() => { 
                onSelect(product);
                const sound = new Audio();
                sound.src = beep;
                sound.play();
            }} 
            className="select-none cursor-pointer transition-shadow overflow-hidden rounded-2xl bg-white shadow hover:shadow-lg h-48 flex flex-col"
        >
            <div className="flex-1 overflow-hidden">
                <img 
                    src={imageUrl} 
                    alt={product.name}
                    className={`w-full h-full ${product.imageUrl ? 'object-cover' : 'object-contain p-2'}`}
                    onError={(e) => {
                        // Fallback to placeholder on error
                        const img = e.target as HTMLImageElement;
                        if (img.src !== placeholder) {
                            img.src = placeholder;
                            img.className = 'w-full h-full object-contain p-2';
                        }
                    }}
                />
            </div>
            <div className="flex pb-3 px-3 text-sm mt-2">
                <p className="flex-grow truncate mr-1 font-medium">{product.name}</p>
                <p className="nowrap font-semibold text-orange-600">€{product.price.toFixed(2)}</p>
            </div>
        </div>
    );
};

export default ProductItem; 