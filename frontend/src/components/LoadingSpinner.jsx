import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
    );
}