import React, { useState } from "react";
import { FiMenu } from "react-icons/fi"; // Import menu icon

const DropdownMenu = ({ handleLogout, platform }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block">
            {/* Menu Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={platform==='spotify'  ? " p-2 border rounded-md bg-gray-800 hover:bg-gray-700 cursor-pointer": "p-2 border rounded-md bg-orange-700 hover:bg-orange-800 cursor-pointer" }
            >
                <FiMenu size={24} />
            </button>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-md">
                    {platform === 'spotify' ? 
                    <button
                        onClick={handleLogout}
                        className="block w-full text-purple-600 bg-white px-2 py-1 rounded"
                    >
                        Logout
                    </button>
                        :
                        <button onClick={handleLogout} className="block w-full text-orange-600 bg-white px-2 py-1 rounded">
                            Logout
                        </button>
                    }
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;
