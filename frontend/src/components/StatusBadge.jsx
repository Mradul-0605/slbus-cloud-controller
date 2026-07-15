import React from 'react';

export default function StatusBadge({ connected }) {
    return (
        <span className={`text-sm font-medium ${connected ? 'text-green-500' : 'text-red-500'}`}>
            {connected ? '● Connected' : '● Disconnected'}
        </span>
    );
}