import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import classnames from 'classnames';
import clipboardCopy from 'clipboard-copy';
import * as appPropTypes from '../appPropTypes';
import { withRoomContext } from '../../RoomContext';
import * as requestActions from '../../redux/requestActions';
import { Appear } from '../transitions';
import Me from '../Me';
import ChatInput from '../ChatInput';
import Peers from '../Peers';
import Notifications from '../Notifications';
import "./Room.scss";

class Room extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      isHideMe: false,
    }
    this.handleHideMe = this.handleHideMe.bind(this);
  }

  render() {
    const { roomClient, room, me, amActiveSpeaker, onRoomLinkCopy } = this.props

    return (
      <Appear duration={300}>
        <div className="room-component">
          <Notifications />

          <div className="state">
            <div className={classnames('icon', room.state)} />
            <p className={classnames('text', room.state)}>{room.state}</p>
          </div>

          <div className="room-link-wrapper">
            <div className="room-link">
              <a
                className="link"
                href={room.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  // If this is a 'Open in new window/tab' don't prevent
                  // click default action.
                  if (
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.metaKey ||
                    // Middle click (IE > 9 and everyone else).
                    (event.button && event.button === 1)
                  ) {
                    return
                  }

                  event.preventDefault()

                  clipboardCopy(room.url).then(onRoomLinkCopy)
                }}
              >
                invitation link
              </a>
            </div>
          </div>

          <Peers />
          
          {!this.state.isHideMe && (
          <div
            className={classnames('me-container', {
              'active-speaker': amActiveSpeaker,
            })}
          >
            
            <Me />
          </div>)}

          <div className="hide-me">
            <div
              className={!this.state.isHideMe ? classnames('button', 'hide-icon') : classnames('button', 'restore-icon')}
              data-tip={!this.state.isHideMe ? "Hide Me" : "Show Me"}
              onClick={this.handleHideMe}
            />
          </div>

          <div className="chat-input-container">
            <ChatInput />
          </div>

          <div className="sidebar">
            <div
              className={classnames('button', 'hide-videos', {
                on: me.audioOnly,
                disabled: me.audioOnlyInProgress,
              })}
              data-tip={"Show/hide participants' video"}
              onClick={() => {
                me.audioOnly
                  ? roomClient.disableAudioOnly()
                  : roomClient.enableAudioOnly()
              }}
            />

            <div
              className={classnames('button', 'mute-audio', {
                on: me.audioMuted,
              })}
              data-tip={"Mute/unmute participants' audio"}
              onClick={() => {
                me.audioMuted
                  ? roomClient.unmuteAudio()
                  : roomClient.muteAudio()
              }}
            />

            <div
              className={classnames('button', 'restart-ice', {
                disabled: me.restartIceInProgress,
              })}
              data-tip="Restart ICE"
              onClick={() => roomClient.restartIce()}
            />
          </div>

          <ReactTooltip
            type="light"
            effect="solid"
            delayShow={100}
            delayHide={100}
            delayUpdate={50}
          />
        </div>
      </Appear>
    )
  }

  componentDidMount() {
    const { roomClient } = this.props

    roomClient.join()
  }

  handleHideMe() {
    this.setState({ isHideMe: !this.state.isHideMe });
  }
}

Room.propTypes = {
  roomClient: PropTypes.any.isRequired,
  room: appPropTypes.Room.isRequired,
  me: appPropTypes.Me.isRequired,
  amActiveSpeaker: PropTypes.bool.isRequired,
  onRoomLinkCopy: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => {
  return {
    room: state.room,
    me: state.me,
    amActiveSpeaker: state.me.id === state.room.activeSpeakerId,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onRoomLinkCopy: () => {
      dispatch(
        requestActions.notify({
          text: 'Room link copied to the clipboard',
        })
      )
    }
  }
}

const RoomContainer = withRoomContext(
  connect(mapStateToProps, mapDispatchToProps)(Room)
)

export default RoomContainer
