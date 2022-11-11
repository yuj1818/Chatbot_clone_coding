import React, {useEffect, useRef} from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {saveMessage} from "../_actions/message_actions";
import Message from "./Sections/Message";
import { List, Icon, Avatar } from 'antd';
import Card from "./Sections/Card";

function Chatbot() {

    const dispatch = useDispatch();
    const messagesFromRedux = useSelector(state => state.message.messages);
    const messageEndRef = useRef(null);

    useEffect(() => {
        if(messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth'});
        }
    });

    useEffect(() => {
        eventQuery('welcomeToMyWebsite')
    }, []);

    const textQuery = async (text) => {

        // 내가 보낸 메시지를 관리
        let conversation = {
            who: 'user',
            content: {
                text: {
                    text: text
                }
            }
        }

        dispatch(saveMessage(conversation));
        //console.log('text I sent', conversation)

        // 챗봇이 보낸 메시지를 관리

        const textQueryVariables = {
            text: text
        }

        try {
            //텍스트 쿼리로 request 보냄
            const response = await axios.post('/api/dialogflow/textQuery', textQueryVariables)

            for (let content of response.data.fulfillmentMessages) {
                conversation = {
                    who: 'chatbot',
                    content: content
                }
                dispatch(saveMessage(conversation))
            }
        } catch (e) {
            conversation = {
                who: 'user',
                content: {
                    text: {
                        text: "에러 발생"
                    }
                }
            }
            dispatch(saveMessage(conversation))
        }
    }

    const eventQuery = async (event) => {

        // 챗봇이 보낸 메시지를 관리

        const eventQueryVariables = {
            event
        }

        try {
            //텍스트 쿼리로 request 보냄
            const response = await axios.post('/api/dialogflow/eventQuery', eventQueryVariables)
            for (let content of response.data.fulfillmentMessages) {
                let conversation = {
                    who: 'chatbot',
                    content: content
                }
                dispatch(saveMessage(conversation))
            }
        } catch (e) {
            let conversation = {
                who: 'user',
                content: {
                    text: {
                        text: "에러 발생"
                    }
                }
            }
            dispatch(saveMessage(conversation))
        }
    }

    const keyPressHandler = e => {
        if(e.key === "Enter") {
            if(!e.target.value) {
                return alert('내용을 입력해주세요.')
            }
            //텍스트 쿼리 라우트에 request 보냄
            textQuery(e.target.value);

            e.target.value = "";
        }
    }

    const renderCards = (cards) => {
        return cards.map((card, idx) => <Card key={idx} cardInfo={card.structValue} />)
    }

    const renderOneMessage = (message, idx) => {
        console.log('message', message)

        //메시지를 종류별로 분류하기 위해 조건 설정
        if(message.content && message.content.text && message.content.text.text) {
            //대화를 위한 템플릿
            return <Message key={idx} who={message.who} text={message.content.text.text} />
        } else if(message.content && message.content.payload.fields.card) {

            const AvatarSrc = message.who === 'chatbot' ? <Icon type="robot" /> : <Icon type="smile" />

            return <div key={''}>
                <List.Item style={{ padding: '1rem' }}>
                    <List.Item.Meta
                        avatar={<Avatar icon={AvatarSrc}/>}
                        title={message.who}
                        description={renderCards(message.content.payload.fields.card.listValue.values)}
                    />
                </List.Item>
            </div>
        }

        //카드 메시지를 위한 템플릿

    }

    const renderMessage = (returnedMessages) => {
        if(returnedMessages) {
            return returnedMessages.map((message, idx) => {
                return renderOneMessage(message, idx);
            })
        } else {
            return null;
        }
    }

    return (
        <div style={{height: 700, width: 700, border: '3px solid black', borderRadius: '7px'}}>
            <div style={{ height: 644, width: '100%', overflow: 'auto'}}>
                {renderMessage(messagesFromRedux)}
                <div ref={messageEndRef} />
            </div>
            <input
                style={{ margin: 0, width: '100%', height: 50, borderRadius: '4px', padding: '5px', fontSize: '1rem'}}
                placeholder="Send a message..."
                onKeyPress={keyPressHandler}
                type="text"
            />
        </div>
    )
}

export default Chatbot;
