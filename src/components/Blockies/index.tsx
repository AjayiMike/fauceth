import React from "react";
import ReactBlockies from "react-blockies";

const Blockies: React.FC<{ seed: string }> = ({ seed }) => {
    return (
        <ReactBlockies
            seed={seed}
            size={12}
            scale={3}
            className="rounded-full"
        />
    );
};
export default Blockies;
