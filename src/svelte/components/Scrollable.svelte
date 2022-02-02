<script>
    import { onMount } from "svelte";
    
    let el;
    let track;
    export let seperate = false;
    export let horizontal = false;
    export let scrollSpeed = 1;
    let scroll = 0;

    onMount(() => {
        el.addEventListener('wheel', (e) => {
            if (el.clientWidth < track.clientWidth) {
                e.preventDefault();
                scroll = Math.min(Math.max(scroll + e.deltaY * scrollSpeed, -track.clientWidth + el.clientWidth), 0);
                if (horizontal) {
                    track.style.left = scroll + 'px';
                } else {
                    track.style.top = scroll + 'px';
                }
            }
        })

        el.addEventListener('mouseleave', () => {
            if (!seperate) {
                track.style.left = 0 + 'px';
                track.style.top = 0 + 'px';
            }
        })
    })
</script>

<div bind:this={el} class="scrollable">
    <div bind:this={track} class="track">
        <slot></slot>
    </div>
</div>

<style>
    .scrollable {
        overflow: hidden;
        position: relative;
    }

    .track {
        width: fit-content;
        position: relative;
        left: 0;
        top: 0;

        transition: all .64s cubic-bezier(0.075, 0.82, 0.165, 1)
    }
</style>