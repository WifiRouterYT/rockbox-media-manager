import { createSignal, Show } from "solid-js";
import { MdRoundSkip_next, MdRoundSkip_previous, MdFillPause, MdRoundRepeat, MdRoundShuffle, MdRoundRepeat_one } from 'solid-icons/md';

import "./MediaBar.css";

export function MediaBar(props) {
    const [isShuffleEnabled, setShuffleStatus] = createSignal(false);

    // repeat modes:
    //  0: no repeat
    //  1: repeat all
    //  2: repeat one
    const [repeatMode, setRepeatMode] = createSignal(0);

    // tmp
    const [playingStatus, setPlayingStatus] = createSignal(false);

    return (
        <div class="media-bar">
            <div class="controls">
                <div class="section one">
                    {/* song info & quick settings */}
                    <button onClick={() => setPlayingStatus(!playingStatus())}>toggle</button>
                </div>
                <div class={"section two" + (playingStatus() === true ? " " : " disabled")}>
                    {/* playback controls */}
                    <MdRoundShuffle class={"icon-small" + (isShuffleEnabled() === true ? " active" : "")} onClick={() => setShuffleStatus(!isShuffleEnabled())} />
                    <MdRoundSkip_previous />
                    <MdFillPause class="icon-big"/>
                    <MdRoundSkip_next />
                    <Show when={repeatMode() === 0}> <MdRoundRepeat class="icon-small" onClick={() => setRepeatMode(1)} /> </Show>
                    <Show when={repeatMode() === 1}> <MdRoundRepeat class="icon-small active" onClick={() => setRepeatMode(2)} /> </Show>
                    <Show when={repeatMode() === 2}> <MdRoundRepeat_one class="icon-small active" onClick={() => setRepeatMode(0)} /> </Show>
                </div>
                <div class="section three">
                    {/* file info (flac / bitrate / whatever in a little pill), volume, queue, lyrics, etc */}
                </div>
            </div>
        </div>
    )
}