/* eslint-disable jsx-control-statements/jsx-use-if-tag */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Spinner from 'react-spinner';
import hark from 'hark';
import Logger from '../../Logger';
import * as appPropTypes from '../appPropTypes';
import EditableInput from '../EditableInput';
import { switchScreenMode } from '../../redux/stateActions';
import "./PeerView.scss";

const logger = new Logger('PeerView')

class PeerView extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state={
            audioVolume: 0, // Integer from 0 to 10.,
            showInfo: window.SHOW_INFO||false,
            videoResolutionWidth: null,
            videoResolutionHeight: null,
            videoCanPlay: false,
            videoElemPaused: false,
            maxSpatialLayer: null,
            videoConsumerId: props.videoConsumerId,
            supportFullScreen: false,
            isHideMe: false,
        }

        // Latest received video track.
        // @type {MediaStreamTrack}
        this._audioTrack=null

        // Latest received video track.
        // @type {MediaStreamTrack}
        this._videoTrack=null

        // Hark instance.
        // @type {Object}
        this._hark=null

        // Periodic timer for reading video resolution.
        this._videoResolutionPeriodicTimer=null

        this.onFullScreenExit = this.onFullScreenExit.bind(this);
        this.onHideMe = this.onHideMe.bind(this);
    }

    render()
    {
        const {
            isMe,
            peer,
            audioMuted,
            videoVisible,
            videoScore,
            onChangeDisplayName,
            onScreenChange
        }=this.props


        const {
            audioVolume,
            videoCanPlay,
            videoElemPaused,
        }=this.state

        return (
            <div className="peer-view-component">
                <div className="info">
                    <div className={ classnames('peer',{ 'is-me': isMe }) }>
                        { isMe?
                            <EditableInput
                                value={ peer.displayName }
                                propName="displayName"
                                className="display-name editable"
                                classLoading="loading"
                                classInvalid="invalid"
                                shouldBlockWhileLoading
                                editProps={ {
                                    maxLength: 20,
                                    autoCorrect: 'false',
                                    spellCheck: 'false',
                                } }
                                onChange={ ({ displayName }) =>
                                    onChangeDisplayName(displayName)
                                }
                            />:<span className="display-name">{ peer.displayName }</span>
                        }

                        <div className="row">
                            <span className={ classnames('device-icon',peer.device.flag) } />
                            <span className="device-version">
                                { peer.device.name } { peer.device.version||null }
                            </span>
                        </div>
                    </div>
                </div>
                <video
                    ref={`videoElem` }
                    className={ classnames({
                        'is-me': isMe,
                        hidden: !videoVisible||!videoCanPlay
                    }) }
                    autoPlay
                    playsInline
                    style={{ display: this.state.isHideMe ? 'none' : 'block' }}
                    muted
                    controls={ false }
                    onLoadedMetadata={() => {
                        this.setState({
                            supportFullScreen: true
                        })
                    }}
                />

                <audio
                    ref="audioElem"
                    autoPlay
                    playsInline
                    muted={ isMe||audioMuted }
                    controls={ false }
                />

                <div className="volume-container">
                    <div className={ classnames('bar',`level${audioVolume}`) } />
                </div>

                <div className="toolbar">
                    {this.state.supportFullScreen && (
                        <div
                            className={classnames('button', 'fullscreen-ice')}
                            data-tip="Full Screen"
                            onClick={() => onScreenChange(peer.id)}
                        />
                    )}
                </div>

                {videoVisible&&videoScore<5?
                    <div className="spinner-container">
                        <Spinner />
                    </div>:null }

                {videoElemPaused? <div className="video-elem-paused" />:null }

            </div>
        )
    }

    componentDidMount()
    {
        const { audioTrack,videoTrack }=this.props

        this._setTracks(audioTrack,videoTrack)
    }

    componentWillUnmount()
    {
        if (this._hark) this._hark.stop()

        clearInterval(this._videoResolutionPeriodicTimer)

        const { videoElem }=this.refs

        if (videoElem)
        {
            videoElem.oncanplay=null
            videoElem.onplay=null
            videoElem.onpause=null
        }
    }

    componentWillUpdate()
    {
        const { isMe,audioTrack,videoTrack,videoRtpParameters }=this.props

        const { maxSpatialLayer }=this.state

        if (isMe&&videoRtpParameters&&maxSpatialLayer===null)
        {
            this.setState({
                maxSpatialLayer: videoRtpParameters.encodings.length-1,
            })
        } else if (isMe&&!videoRtpParameters&&maxSpatialLayer!==null)
        {
            this.setState({ maxSpatialLayer: null })
        }

        this._setTracks(audioTrack,videoTrack)
    }

    componentDidUpdate() {
    
        const { me, peer } = this.props;

        if (me.fullScreenPeer === peer.id ) {
            const { videoElem } = this.refs;

            if (typeof videoElem.requestFullscreen === 'function') {
                videoElem.requestFullscreen().then(() => {
                    document.addEventListener('fullscreenchange', this.onFullScreenExit, false);
                    document.addEventListener('mozfullscreenchange', this.onFullScreenExit, false);
                    document.addEventListener('MSFullscreenChange', this.onFullScreenExit, false);
                    document.addEventListener('webkitfullscreenchange', this.onFullScreenExit, false);
                }).catch(console.error);
            } else {
                videoElem.webkitEnterFullScreen();
                document.addEventListener('webkitfullscreenchange', this.onFullScreenExit, false);
            }
        }
    }

    onFullScreenExit () {
        if (!document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
            const { onScreenChange } = this.props;

            document.removeEventListener('fullscreenchange', this.onFullScreenExit);
            document.removeEventListener('mozfullscreenchange', this.onFullScreenExit);
            document.removeEventListener('MSFullscreenChange', this.onFullScreenExit);
            document.removeEventListener('webkitfullscreenchange', this.onFullScreenExit);
            onScreenChange(null);
        }
    }

    _setTracks(audioTrack,videoTrack)
    {
        if (this._audioTrack===audioTrack&&this._videoTrack===videoTrack)
            return

        this._audioTrack=audioTrack
        this._videoTrack=videoTrack

        if (this._hark) this._hark.stop()

        this._stopVideoResolution()

        const { audioElem,videoElem }=this.refs

        if (audioTrack)
        {
            const stream=new MediaStream()

            stream.addTrack(audioTrack)
            audioElem.srcObject=stream

            audioElem
                .play()
                .catch((error) => logger.warn('audioElem.play() failed:%o',error))

            this._runHark(stream)
        } else
        {
            audioElem.srcObject=null
        }

        if (videoTrack)
        {
            const stream=new MediaStream()

            stream.addTrack(videoTrack)
            videoElem.srcObject=stream

            videoElem.oncanplay=() => this.setState({ videoCanPlay: true })

            videoElem.onplay=() =>
            {
                this.setState({ videoElemPaused: false })

                audioElem
                    .play()
                    .catch((error) => logger.warn('audioElem.play() failed:%o',error))
            }

            videoElem.onpause=() => this.setState({ videoElemPaused: true })

            videoElem
                .play()
                .catch((error) => logger.warn('videoElem.play() failed:%o',error))

            this._startVideoResolution()

        } else
        {
            videoElem.srcObject=null
        }
    }

    _runHark(stream)
    {
        if (!stream.getAudioTracks()[0])
            throw new Error('_runHark() | given stream has no audio track')

        this._hark=hark(stream,{ play: false })

        // eslint-disable-next-line no-unused-vars
        this._hark.on('volume_change',(dBs,threshold) =>
        {
            // The exact formula to convert from dBs (-100..0) to linear (0..1) is:
            //   Math.pow(10, dBs / 20)
            // However it does not produce a visually useful output, so let exagerate
            // it a bit. Also, let convert it from 0..1 to 0..10 and avoid value 1 to
            // minimize component renderings.
            let audioVolume=Math.round(Math.pow(10,dBs/85)*10)

            if (audioVolume===1) audioVolume=0

            if (audioVolume!==this.state.audioVolume) this.setState({ audioVolume })
        })
    }

    _startVideoResolution()
    {
        this._videoResolutionPeriodicTimer=setInterval(() =>
        {
            const { videoResolutionWidth,videoResolutionHeight }=this.state
            const { videoElem }=this.refs

            if (
                videoElem.videoWidth!==videoResolutionWidth||
                videoElem.videoHeight!==videoResolutionHeight
            )
            {
                this.setState({
                    videoResolutionWidth: videoElem.videoWidth,
                    videoResolutionHeight: videoElem.videoHeight,
                })
            }
        },500)
    }

    _stopVideoResolution()
    {
        clearInterval(this._videoResolutionPeriodicTimer)

        this.setState({
            videoResolutionWidth: null,
            videoResolutionHeight: null,
        })
    }

    onHideMe() {
        console.log("dddd");
        if (!this.state.isHideMe)
            this.setState({ isHideMe: true });
        else 
            this.setState({ isHideMe: false });
    }
}

PeerView.propTypes = {
    isMe: PropTypes.bool,
    peer: PropTypes.oneOfType([appPropTypes.Me, appPropTypes.Peer]).isRequired,
    audioProducerId: PropTypes.string,
    videoProducerId: PropTypes.string,
    audioConsumerId: PropTypes.string,
    videoConsumerId: PropTypes.string,
    audioRtpParameters: PropTypes.object,
    videoRtpParameters: PropTypes.object,
    consumerSpatialLayers: PropTypes.number,
    consumerTemporalLayers: PropTypes.number,
    consumerCurrentSpatialLayer: PropTypes.number,
    consumerCurrentTemporalLayer: PropTypes.number,
    consumerPreferredSpatialLayer: PropTypes.number,
    consumerPreferredTemporalLayer: PropTypes.number,
    consumerPriority: PropTypes.number,
    audioTrack: PropTypes.any,
    videoTrack: PropTypes.any,
    audioMuted: PropTypes.bool,
    videoVisible: PropTypes.bool.isRequired,
    videoMultiLayer: PropTypes.bool,
    audioCodec: PropTypes.string,
    videoCodec: PropTypes.string,
    audioScore: PropTypes.any,
    videoScore: PropTypes.any,
    onChangeDisplayName: PropTypes.func,
    onChangeMaxSendingSpatialLayer: PropTypes.func,
    onChangeVideoPreferredLayers: PropTypes.func,
    onChangeVideoPriority: PropTypes.func,
    onRequestKeyFrame: PropTypes.func,
    onStatsClick: PropTypes.func.isRequired,
    me: appPropTypes.Me.isRequired,
    onScreenChange: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => {
    return {
        me: state.me,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        onScreenChange: (peerId) => {
            dispatch(switchScreenMode(peerId))
        },
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PeerView);
