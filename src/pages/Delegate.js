import React, { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

import Select from 'react-select';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import AlertModal from "../alert";
import MultipleWalletApi, { Cardano } from '../nami-js';

import moneyIcon from '../images/other_icon/money.svg';

let walletApi;

export default function Profile() {
    // const [address, setAddress] = useState();
    const [displayName, setDisplayName] = useState();
    const [about, setAbout] = useState();
    const [userData, setUserData] = useState();
    const [delationList, setDelationList] = useState();
    const [project, setProject] = useState();
    const [presentation, setPresentation] = useState();
    const [projectList, setProjectList] = useState()
    const [projectId, setProjectId] = useState();

    const [localStorageChange, setLocalStorageChange] = useState(false);
    
    const [alertInformation, setAlertInformation] = useState({
        content: "",
        isDisplayed: false,
        type: "information",
    });
    async function init_wallet() {
        try {
            const walletName = localStorage.getItem('wallet');
            if (walletName) {
                const S = await Cardano();
                walletApi = new MultipleWalletApi(
                    S,
                    window.cardano[walletName],
                    // blockfrostApiKey
                    {
                        0: "preprodTjTPf4nKUTGwgIFgk1wqIj4vtpHe9qi6", // testnet
                        1: "mainnetzPROg9q7idoA9ssVcWQMPtnawNVx0C0K", // mainnet
                    }
                );
            }
        }
        catch (e) {
            console.log(e)
            if (e.info) e = e.info;
            setAlertInformation({
                type: "information",
                isDisplayed: true,
                content: `${e}`,
            });
            localStorage.setItem('wallet', '');
            setUserAdaDisplay('');
        }
    }

    useEffect(() => {
        window.addEventListener('storage', () => {
            // console.log("change to local storage!");
            setLocalStorageChange(!localStorageChange);
        })
        init_wallet();
        getProjectList();
        getDelationList();

    }, [localStorageChange])

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
    async function getDelationList() {
        try {
            setAlertInformation({
                type: "loading",
                isDisplayed: true,
                content: null,
            });

            const response = await (await fetch(
                // `http://localhost:8787/gov3/GetDelegateList`,
                `https://api.aidev-cardano.com/gov3/GetDelegateList`,
            )).json();

            if (response.error) {
                setDelationList();
                console.log(response);
            }
            else {
                setDelationList(response);
            }
            setAlertInformation({
                type: "loading",
                isDisplayed: false,
                content: null,
            });
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
    async function delegateVote(to_address) {
        try {
            setAlertInformation({
                type: "loading",
                isDisplayed: true,
                content: null,
            });
            if (!walletApi) {
                setAlertInformation({
                    type: "information",
                    isDisplayed: true,
                    content: `Connect your wallet first`,
                });
                return;
            }
            if (!project) {
                setAlertInformation({
                    type: "information",
                    isDisplayed: true,
                    content: `something went wrong`,
                });
                return;
            }
            const sign_data = await walletApi.signData(`DelegateVote/Edit`);

            const address = await walletApi.getAddress();
            const body = {
                'address': address,
                'project_id': projectId,
                'to_address': to_address,
                'key': sign_data.key,
                'signature': sign_data.signature,
            }
            const data = await (await fetch(
                // 'http://localhost:8787/gov3/DelegateVote/Edit',
                'https://api.aidev-cardano.com/gov3/DelegateVote/Edit',
                {
                    method:'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body)
                }
            )).json();
    
            if (data.error) {
                console.log(data.error);
                setAlertInformation({
                    type: "information",
                    isDisplayed: true,
                    content: `${data.error}`,
                });
                return;
            }
            setAlertInformation({
                type: "information",
                isDisplayed: true,
                content: `${data.message}`,
            });
        }
        catch (e) {
            if (e.info) e = e.info;
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
            <div className='p-5'></div>
            <div className='m-auto flex flex-col rounded-lg border-2 border-b-4 border-r-4 border-black w-5/6 md:w-3/5 h-auto'>
                <div className='m-auto flex flex-col w-5/6 justify-center'>
                    <p className='mt-5 text-left text-black text-xl'>
                        Project
                    </p>
                    {/* project drop down */}
                    <div>
                        {projectList
                            ?   <Select
                                    className="w-full"
                                    styles={customStyles}
                                    placeholder={"Select"}
                                    onChange={(event) => {
                                        setProject(event.value.split("_")[0]);
                                        setProjectId(event.value.split("_")[1]);
                                    }}
                                    options={tokenListOption(projectList)}
                                />
                            :""
                        }
                    </div>
                    
                    <div>
                        {(delationList && project)
                        ?
                        <div>
                            {delationList.map((data) => {
                                if (data.project === project) {
                                    return (
                                        <div className='m-5 flex flex-row hover:bg-[#f4f3fa] justify-between'>
                                            <Link to={`/user/${data.address}`} className='m-2 text-xl font-bold hover:text-blue-400'>
                                                {data.stake_address.slice(0,10)}...
                                            </Link>
                                            <button onClick={() => {delegateVote(data.address)}} className='my-auto rounded-[200px] flex w-20 h-8 shadow-sm shadow-indigo-500 text-[#522c99] bg-gradient-to-r from-[#4235e1] to-[#faf9ff] hover:animate-pulse transition-all hover:bg-gradient-to-t0'>
                                                <p className='m-auto text-base text-white'>
                                                    Delegate
                                                </p>
                                            </button>
                                        </div>
                                    );
                                }
                            })}
                        </div>

                        :""
                        }
                    </div>

                    
                </div>
                <div className='p-2'></div>
            </div>


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

const customStyles = {
    menu: (provided, state) => ({
        ...provided,
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        color: '#008BF0',
        border: '2px solid #000000',
    }),
    option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? '#008BF0' : 'black',
        backgroundColor: 'white',
        borderRadius: '1rem',
        margin: 'auto',
        // flexDirection: 'row',
        // display: 'flex',
        '&:hover': {
            backgroundColor: '#008BF0',
            color: 'white',
        },
        textAlign: 'center',
        width: '100%',/* Need a specific value to work */
    }),
    dropdownIndicator: () => ({
        color: '#008BF0',
        width: '1.5rem',
    }),

    control: () => ({
        // none of react-select's styles are passed to <Control />
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: '2px solid #000000',
        margin: 'auto',
        flexDirection: 'row',
        display: 'flex',
    }),
    singleValue: () => ({
        color: '#000000',
        position: 'absolute',
        textAlign: 'center',
        width: '100%',/* Need a specific value to work */
    }),
    placeholder: () => ({
        color: '#000000',
        position: 'absolute',
        // left: '10px',
        textAlign: 'center',
        width: '100%',/* Need a specific value to work */
        fontSize: '1rem',
    })
}

function tokenListOption(projectList) {
    let options = [];
    for (let data of projectList) {
        options.push(
            {
                value: `${data.name}_${data.id}`,
                label: 
                <div className="justify-center flex flex-row justify-center">
                    <img className='w-8 h-8' src={data.icon}/>
                    <p className='ml-2 text-xl'>{data.name}</p>
                </div>
            },
        )
    }
    return options
}

function findDelegationPresentation(delegationData, project) {
    for (let data of delegationData) {
        if (data.project === project) {
            console.log(project)
            return data.presentation;
        }
    }

    return '';
}