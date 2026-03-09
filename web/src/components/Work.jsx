import React from 'react';
import { projects } from '../data/projects';
import SectionLabel from './SectionLabel';
import BentoGrid from './BentoGrid';
import './Work.css';

const Work = () => {
    const clientProjects = projects.filter(p => p.type === 'client');
    const personalProjects = projects.filter(p => p.type === 'personal');

    return (
        <section className="work-section">
            <SectionLabel index="01" label="Professional Work" />
            <BentoGrid projects={clientProjects} />

            <div className="work-section-spacer" />

            <SectionLabel index="02" label="Personal Projects" />
            <BentoGrid projects={personalProjects} />
        </section>
    );
};

export default Work;
