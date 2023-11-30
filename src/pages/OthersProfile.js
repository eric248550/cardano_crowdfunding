import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Routes, Route, useParams } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import AlertModal from "../alert";


export default function OthersProfile() {
    try {
        let { userAddress } = useParams();
        const [userData, setUserData] = useState();
        const [delationData, setDelationData] = useState();
        const [userVoteData, setUserVoteData] = useState();
        const [userProposalData, setUserProposalData] = useState();

        const [alertInformation, setAlertInformation] = useState({
            content: "",
            isDisplayed: false,
            type: "information",
        });
        useEffect(() => {
            getUserData();
            getDelationData();
            getUserVoteData();
            getUserProposalData();
        }, [])
        async function getUserData() {
            try {
                setAlertInformation({
                    type: "loading",
                    isDisplayed: true,
                    content: null,
                });
    
                const response = await (await fetch(
                    // `http://localhost:8787/gov3/User/${userAddress}`,
                    `https://api.aidev-cardano.com/gov3/User/${userAddress}`,
                )).json();
    
                if (response.error) {
                    setUserData();
                    console.log(response);
                }
                else {
                    setUserData(response);
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
        async function getDelationData() {
            try {
                setAlertInformation({
                    type: "loading",
                    isDisplayed: true,
                    content: null,
                });
    
                const response = await (await fetch(
                    // `http://localhost:8787/gov3/Delegation/User/${userAddress}`,
                    `https://api.aidev-cardano.com/gov3/Delegation/User/${userAddress}`,
                )).json();
    
                if (response.error) {
                    setDelationData();
                    console.log(response);
                }
                else {
                    setDelationData(response);
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
        async function getUserVoteData() {
            try {
                setAlertInformation({
                    type: "loading",
                    isDisplayed: true,
                    content: null,
                });
    
                const response = await (await fetch(
                    // `http://localhost:8787/gov3/GetUserVote/${userAddress}`,
                    `https://api.aidev-cardano.com/gov3/GetUserVote/${userAddress}`,
                )).json();
    
                if (response.error || response.length === 0) {
                    setUserVoteData();
                    console.log(response);
                }
                else {
                    setUserVoteData(response);
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
        async function getUserProposalData() {
            try {
                setAlertInformation({
                    type: "loading",
                    isDisplayed: true,
                    content: null,
                });
    
                const response = await (await fetch(
                    // `http://localhost:8787/gov3/GetUserProposal/${userAddress}`,
                    `https://api.aidev-cardano.com/gov3/GetUserProposal/${userAddress}`,
                )).json();
    
                if (response.error || response.length === 0) {
                    setUserProposalData();
                    console.log(response);
                }
                else {
                    setUserProposalData(response);
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

        return (
            <div className="min-h-screen bg-cover bg-[url('./images/background.svg')]">
                <div className='p-5'></div>
                <p className='ml-10 text-3xl font-bold'>
                    {userData? userData.display_name : `${userAddress.slice(0,16)}...`}
                </p>
                <pre className='ml-10 whitespace-pre-wrap break-normal text-base text-black'>
                    {userData? userData.about : "No description about this user"}
                </pre>

                <div className='m-auto mt-5 flex flex-col md:flex-row w-11/12'>
                    <div className='flex flex-col md:w-2/3'>
                        <Tabs className='flex flex-col justify-center '>
                            <TabList className='w-full flex flex-row border-black border-b-[1px] justify-start'>
                                <Tab>Votes</Tab>
                                <Tab>Proposals</Tab>
                                <Tab>Delegation</Tab>
                            </TabList>
                            {/* vote */}
                            <TabPanel>
                                {userVoteData
                                ?
                                    <div>
                                        {userVoteData.map((data) => {
                                            return (
                                                <div className='flex flex-row border-[1px] border-black'>
                                                    <img src={data.icon} className='ml-3 my-auto w-12 h-12 rounded-full' />
                                                    <div className='ml-3 flex flex-col'>
                                                        <p className='text-2xl font-bold text-black'>
                                                            {data.title}
                                                        </p>
                                                        <p className='mt-2 text-xs text-black'>vote {time2TimeAgo(data.time_unix)}</p>

                                                        <div className='mt-2 flex flex-row'>
                                                            <p className='text-sm text-black'>
                                                                vote for {data.choice_name}
                                                            </p>
                                                            <p className='ml-5 text-sm text-black'>
                                                                cast power: {data.power}
                                                            </p>
                                                        </div>
                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>
                                : "This account hasn't cast any votes yet"
                                }
                            </TabPanel>
                            {/* proposal */}
                            <TabPanel>
                                {userProposalData
                                    ?
                                        <div>
                                            {userProposalData.map((data) => {
                                                return (
                                                    <div className='flex flex-row border-[1px] border-black'>
                                                        <img src={data.icon} className='ml-3 my-auto w-12 h-12 rounded-full' />
                                                        <div className='ml-3 flex flex-col'>
                                                            <p className='text-2xl font-bold text-black'>
                                                                {data.title}
                                                            </p>
                                                            <p className='mt-2 text-xs text-black'>Open {time2TimeAgo(data.start_time_unix)}</p>
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                        </div>
                                    : "This account hasn't cast any proposal yet"
                                    }
                            </TabPanel>
                            {/* delegation */}
                            <TabPanel>
                                {delationData
                                ?
                                    <div>
                                        {delationData.map((data) => {
                                            return (
                                                <div className='flex flex-row border-[1px] border-black'>
                                                    <img src={data.icon} className='ml-3 my-auto w-12 h-12 rounded-full' />
                                                    <pre className='whitespace-pre-wrap break-normal mt-5 text-base text-black'>
                                                        {data.presentation}
                                                    </pre>
                                                </div>
                                            );
                                        })}
                                    </div>
                                : "This account hasn't cast any votes yet"
                                }
                            </TabPanel>

                        </Tabs>
                    </div>
                    <div className='flex flex-col md:w-1/3'>
                        <div className='mt-10 shadow-xl bg-white mx-auto w-11/12 flex flex-col rounded-xl border-[1px] border-[#acacac]'>
                            <p className='text-xl text-center text-[#acacac]'>User Information</p>
                            <div className='m-2 flex flex-row justify-between'>
                                <p className=''>
                                    Address
                                </p>
                                <p className='text-sm'>
                                    {userData? userData.address.slice(0,10) :""}...
                                </p>
                            </div>

                            <div className='m-2 flex flex-row justify-between'>
                                <p className=''>
                                    Stake Address
                                </p>
                                <p className='text-sm'>
                                    {userData? userData.stake_address.slice(0,10) :""}...
                                </p>
                            </div>

                            <div className='m-2 flex flex-row justify-between'>
                                <p className=''>
                                    Total Votes
                                </p>
                                <p className='text-sm'>
                                    {userVoteData? userVoteData.length :0}
                                </p>
                            </div>

                            <div className='m-2 flex flex-row justify-between'>
                                <p className=''>
                                    Created Proposal
                                </p>
                                <p className='text-sm'>
                                    {userProposalData? userProposalData.length :0}
                                </p>
                            </div>
                        </div>
                    </div>
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
    catch (e) {
        console.log(e);
        return "error"
    }
}

function time2TimeAgo(ts) {
    // This function computes the delta between the
    // provided timestamp and the current time, then test
    // the delta for predefined ranges.

    var d=new Date();  // Gets the current time
    var nowTs = Math.floor(d.getTime()); // getTime() returns milliseconds, and we need seconds, hence the Math.floor and division by 1000
    var seconds = (nowTs - ts) / 1000;

    if (seconds > 0) {
        // more that two days
        if (seconds > 2*24*3600) {
        //    return "a few days ago";
           return Math.floor(seconds/60/60/24) + " days ago";
        }
        // a day
        if (seconds > 24*3600) {
           return "yesterday";
        }
    
        if (seconds > 3600) {
           return Math.floor(seconds/60/60) + " hours ago";
        }
        if (seconds > 60) {
           return Math.floor(seconds/60) + " minutes ago";
        }
    
        if (seconds < 60) {
           return seconds + "seconds ago";
        }
    }
    else {
        seconds = -seconds;
        if (seconds > 2*24*3600) {
        //    return "a few days ago";
            return `in ${Math.floor(seconds/60/60/24)} days`;
        }
        // a day
        if (seconds > 24*3600) {
            return "yesterday";
        }
        if (seconds > 3600) {
            return `in ${Math.floor(seconds/60/60)} hours`;
        }
        if (seconds > 60) {
            return `in ${Math.floor(seconds/60)} minutes`;
        }
    
        if (seconds < 60) {
            return `in ${seconds} seconds`;
        }
    }


}