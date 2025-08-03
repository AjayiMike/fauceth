"use client";

export const getCookieValue = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.match(new RegExp(`; ${name}=([^;]*)`));
    return parts ? parts[1] : null;
};
