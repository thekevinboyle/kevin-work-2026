import React from 'react';
import { motion } from 'framer-motion';

const SectionLabel = ({ index, label }) => {
    return (
        <motion.div
            className="section-label"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="section-label-rule" />
            <div className="section-label-content">
                <span className="section-label-index">{index}</span>
                <span className="section-label-dash">&mdash;</span>
                <span className="section-label-text">{label}</span>
            </div>
        </motion.div>
    );
};

export default SectionLabel;
