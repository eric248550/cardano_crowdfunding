import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { Routes, Route, useParams, json } from 'react-router-dom';
import DateTimePicker from 'react-datetime-picker';

import AlertModal from "../alert";
import MultipleWalletApi, { Cardano } from '../nami-js';
let walletApi;

export default function CreateProposal() {
    let { projectId } = useParams();

    const [alertInformation, setAlertInformation] = useState({
        content: "",
        isDisplayed: false,
        type: "information",
    });

    const [title, setTitle] = useState();
    const [description, setDescription] = useState();
    const [balance, setBalance] = useState();
    const [choices, setChoices] = useState(["",""]);
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());

    const [localStorageChange, setLocalStorageChange] = useState(false);

    window.addEventListener('storage', () => {
        setLocalStorageChange(!localStorageChange);
    })

    useEffect(() => {
        csl();
        let walletBalance_str = localStorage.getItem('balance');
        if (walletBalance_str) setBalance(JSON.parse(walletBalance_str).assets);

        window.addEventListener('storage', () => {
            // console.log("change to local storage!");
            setLocalStorageChange(!localStorageChange);
        })

        return () => {
            window.removeEventListener('storage', null)
        }
    },[localStorageChange]);

    useEffect(() => {
        const defaultDate = new Date();
        defaultDate.setTime(defaultDate.getTime())
        setStartTime(defaultDate);
        setEndTime(defaultDate);
    }, [])
    async function csl() {
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
        }
    }

    async function submitProposal() {
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
                    content: `Connect wallet first`,
                });
                return;
            }
            if (choices.includes('')) {
                setAlertInformation({
                    type: "information",
                    isDisplayed: true,
                    content: `Choices cannot be blank`,
                });
                return;
            }

            const myAddress = await walletApi.getAddress();
            if (!myAddress || !projectId || !title || !description || !choices || !startTime || !endTime) {
                setAlertInformation({
                    type: "information",
                    isDisplayed: true,
                    content: `Proposal not complete`,
                });
                return;
            }

            const sign_data = await walletApi.signData(`CreateProposal:project_${projectId}`);
            const body = {
                'address': myAddress,
                'project_id': parseInt(projectId),
                'title': title,
                'description': description,
                'choices': JSON.stringify(choices),
                'start_time_str': startTime.toUTCString(),
                'start_time_unix': startTime.getTime(),
                'end_time_str': endTime.toUTCString(),
                'end_time_unix': endTime.getTime(),
                'key': sign_data.key,
                'signature': sign_data.signature,
            }
            const data = await (await fetch(
                // 'http://localhost:8787/gov3/CreateProposal',
                'https://api.aidev-cardano.com/gov3/CreateProposal',
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
                content: `Create proposal successfully`,
            });
        }
        catch (e) {
            console.log(e);
            setAlertInformation({
                type: "information",
                isDisplayed: true,
                content: `Error: ${e}`,
            });
        }
    }
    function handleAddChoices() {
        // make temp a new arry to trigger render
        let temp = [...choices];
        temp.push('');
        setChoices(temp);
    }
    function handleUpdateChoices(num, word) {
        let temp = [...choices];
        temp[num] = word;
        setChoices(temp);
    }
    function handleDeleteChoicesn(num) {
        if (num < 2) {
            setAlertInformation({
                type: "information",
                isDisplayed: true,
                content: `Must have at least 2 choices`,
            });
            return;
        }

        let temp = [...choices];
        temp.splice(num, 1);
        setChoices(temp);
    }


    return (
        <div className="min-h-screen bg-cover bg-[url('./images/background.svg')]">
        {/* <div className="min-h-screen bg-cover bg-[#ffffff]"> */}

            <p className='mt-5 text-center font-bold text-3xl'>Create Proposal</p>
            <div className='pt-5 flex flex-col'>
                <div className='m-auto flex flex-col rounded-lg border-2 border-r-4 border-b-4 border-black w-5/6 md:w-3/5 h-auto'>
                    {/* Title */}
                    <div className='m-auto flex flex-col w-5/6 justify-center'>
                        <p className='mt-5 text-left text-black text-xl'>
                            Title
                        </p>
                        <input type="text" className='w-full rounded-lg border-2 border-black mx-auto text-xl h-10 text-center' placeholder='Proposal title'
                            onChange={(event) => {
                                setTitle(event.target.value);
                            }}
                        />
                    </div>
                    {/* Description */}
                    <div className='m-auto flex flex-col w-5/6 justify-center'>
                        <p className='mt-5 mb-2 text-left text-black text-xl'>
                            Description
                        </p>
                        <textarea type="text" placeholder='Proposal description'
                            className='w-full mb-5 rounded-lg border-2 border-black text-xl h-40' required 
                            onChange={(event) => {
                                setDescription(event.target.value);
                            }}
                        />
                    </div>
                    {/* Choices */}
                    <div className='m-auto flex flex-col w-5/6'>
                        <p className='mt-5  text-left text-black text-base'>
                            Choices
                        </p>
                        {choices.map((choice, index) => {
                            return (
                                <div className='mt-5 flex flex-row justify-between w-full rounded-lg border-[1px] border-black hover:border-blue-400 m-auto text-xl h-10'>
                                    <p className='m-auto ml-2 text-black'>{index+1}</p>
                                    <input type="text" className='focus:outline-0 w-full text-center rounded-lg' placeholder={`choice ${index+1}`}
                                        onChange={(event) => {
                                            handleUpdateChoices(index, event.target.value);
                                        }}
                                    />
                                    <button onClick={()=>{handleDeleteChoicesn(index)}} className='mr-2 '>
                                        <p className='text-red-400'>X</p>
                                    </button>
                                </div>
                            );
                                
                            })
                        }
                        <button onClick={handleAddChoices} className='mt-5 flex flex-row'>
                            <div className='rounded-full border-[1px] border-blue-400 w-6 h-6'>
                                <p className='m-auto text-blue-400'>+</p>
                            </div>
                            <p className='ml-2'>add more choice</p>
                        </button>
                    </div>
                    {/* Dates */}
                    <div className='mt-5 m-auto flex flex-col w-5/6'>
                        <div className='m-auto flex flex-col md:flex-row mt-5'>
                            <p className='m-auto'>Start Date</p>
                            <DateTimePicker
                                className="md:ml-5"
                                onChange={setStartTime}
                                value={startTime}
                                minDate={new Date()}
                            />
                        </div>
                        <div className='m-auto flex flex-col md:flex-row mt-5'>
                            <p className='m-auto'>End Date</p>
                            <DateTimePicker
                                className="md:ml-5"
                                onChange={setEndTime}
                                value={endTime}
                                minDate={new Date()}
                            />
                        </div>
                    </div>
                    <div className='p-2'></div>
                </div>

                <button className='mt-5 mb-5 m-auto bg-[#FF9C84] border-2 border-black rounded-lg w-40 h-10 text-white'
                    onClick={submitProposal}
                >
                    Create Proposal
                </button>

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

function tokenListOption(tokenList) {
    let options = [];
    for (let data of tokenList) {
        options.push(
            {
                value: `${data.name}`,
                label: 
                <div className="justify-center flex flex-row justify-center">
                    <img className='w-6 h-6 md:w-8 md:h-8' src={data.image}/>
                    <p className='ml-2 text-base md:text-xl'>${data.name}</p>
                </div>
            },
        )
    }
    return options
}

function nftRaffleOption(balance) {
    let options = [];
    for (let data of balance) {
        if (raffle_nft_list.includes(data.policy)) {
            options.push(
                {
                    value: `${data.policy}.${data.name}`,
                    label: 
                    <div className="justify-center flex flex-row justify-center">
                        <p className='text-xs md:text-base'>{data.name}</p>
                    </div>
                },
            )
        }
    }
    return options
}