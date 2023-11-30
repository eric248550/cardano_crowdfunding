import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import AlertModal from "../alert";


export default function Projects() {

    const [alertInformation, setAlertInformation] = useState({
        content: "",
        isDisplayed: false,
        type: "information",
    });
    const [projectList, setProjectList] = useState()

    useEffect (() => {
        getProjectList()
    }, [])
    async function getProjectList() {
        try {
            const response = await (await fetch(
                // 'http://localhost:8787/gov3/GetProjectList',
                'https://api.aidev-cardano.com/gov3/GetProjectList'
            )).json();

            if (response.error) {
                console.log(response.error);
                setAlertInformation({
                    type: "information",
                    isDisplayed: true,
                    content: `${response.error}`,
                });
                return;
            }

            setProjectList(response);
        }
        catch (e) {
            console.log(e)
            setAlertInformation({
                type: "information",
                isDisplayed: true,
                content: `${e}`,
            });
        }
    }

    return (
        <div className="min-h-screen bg-cover bg-[url('./images/background.svg')]">
            <p className='pt-5 ml-10 text-left text-3xl font-bold'>
                Projects
            </p>
            {projectList?<Project projects={projectList}/> :""}

            {alertInformation.isDisplayed && (
                <AlertModal
                type={alertInformation.type}
                animateNumber={alertInformation.animateNumber}
                bgNumber={alertInformation.bgNumber}
                onClose={() =>
                    setAlertInformation({
                    type: "information",
                    isDisplayed: false,
                    content: null,
                    })
                }
                >
                {alertInformation.content}
                </AlertModal>
            )}
        </div>
    );
}

function Project(props) {
    return (
        <div className='p-5 flex flex-wrap justify-center'>
            {props.projects?
                props.projects.map((project) => {
                    return (
                        <Link className='justify-center hover:brightness-125 w-60 h-auto border-black border-r-4 border-b-4 border-2 m-2 rounded-lg'
                            to={`/projects/${project.id}?project=${encodeURIComponent(JSON.stringify(project))}`}>
                            <div className='flex flex-col'>
                                <img className='mt-2 m-auto w-20 h-20' src={project.icon}/>
                                <p className='mt-2 text-center text-xl font-bold text-black'>
                                    {project.name}
                                </p>
                                <div className='mt-2 m-2 flex flex-row'>
                                    <div className='w-1/2 flex flex-col'>
                                        <p className='text-center text-left text-[10px] text-black'>
                                            Proposal
                                        </p>
                                        <p className='mt-2 text-center text-left text-sm font-semibold text-black'>
                                            {project.proposal_asset_quantity} {project.proposal_asset_name}
                                        </p>
                                    </div>
                                    <div className='w-1/2 flex flex-col justify-center'>
                                        <p className='text-center text-left text-[10px] text-black'>
                                            Vote
                                        </p>
                                        <p className='mt-2 text-center text-left text-sm font-semibold text-black'>
                                            {project.vote_asset_name}
                                        </p>
                                    </div>
                                </div>
                                <div className='m-auto my-2 w-20 flex rounded-lg h-6 bg-emerald-600'>
                                    <p className='m-auto text-xs text-white'>
                                        {project.type}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    );
                    
                })
                :""
            }
        </div>

    );
}