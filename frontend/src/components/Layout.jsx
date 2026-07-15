import React from 'react';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen p-4 md:p-6">
            {children}
        </div>
    );
}