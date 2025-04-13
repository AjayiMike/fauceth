interface NetworkIconProps {
    name: string;
}

export const NetworkIcon = ({ name }: NetworkIconProps) => {
    // Generate a color based on the network name
    const getColorFromName = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };

    const color = getColorFromName(name);
    const initials = name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className="flex-shrink-0">
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{
                    backgroundColor: color,
                    minWidth: "2rem",
                    minHeight: "2rem",
                    maxWidth: "2rem",
                    maxHeight: "2rem",
                }}
            >
                {initials}
            </div>
        </div>
    );
};
