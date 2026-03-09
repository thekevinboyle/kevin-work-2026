import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { projectDetails } from '../data/projects';

const BentoGrid = ({ projects }) => {
    return (
        <div className="bento-grid">
            {projects.map((project, index) => {
                const details = projectDetails[project.id];
                const sizeClass = `bento-card--${project.size || 'half'}`;
                const hasExternalUrl = details?.externalUrl;

                const CardWrapper = hasExternalUrl
                    ? ({ children }) => (
                        <a href={details.externalUrl} target="_blank" rel="noopener noreferrer" className="bento-card-link">
                            {children}
                        </a>
                    )
                    : ({ children }) => (
                        <Link to={`/work/${project.id}`} className="bento-card-link">
                            {children}
                        </Link>
                    );

                return (
                    <motion.div
                        key={project.id}
                        className={`bento-card ${sizeClass}`}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{
                            duration: 0.6,
                            delay: index * 0.1,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                    >
                        <CardWrapper>
                            <div
                                className="bento-card-image-wrapper"
                                style={{ backgroundColor: project.color }}
                            >
                                <img
                                    src={project.image}
                                    alt={project.title}
                                    className="bento-card-image"
                                    loading="lazy"
                                />
                            </div>
                            <div className="bento-card-overlay">
                                <div className="bento-card-meta">
                                    <span className="bento-card-year">
                                        {details?.year || '2024'}
                                    </span>
                                    <h3 className="bento-card-title">
                                        {project.title}
                                    </h3>
                                    <p className="bento-card-category">
                                        {project.category}
                                    </p>
                                </div>
                            </div>
                        </CardWrapper>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default BentoGrid;
