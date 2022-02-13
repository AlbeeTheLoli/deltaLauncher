<script>
    let user = "";
</script>

{#if user == ""}
    <svg class="wtfbro no-drag" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 277.95 277.95">
        <defs>
            <style>
                @keyframes fade1 {
                    0% {
                        opacity: 0;
                    }

                    60% {
                        opacity: 1;
                    }

                    100% {
                        opacity: 1;
                    }
                }

                @keyframes fade2 {
                    0% {
                        opacity: 0;
                    }

                    10% {
                        opacity: 0;
                    }

                    80% {
                        opacity: 1;
                    }

                    100% {
                        opacity: 1;
                    }
                }

                @keyframes fade3 {
                    0% {
                        opacity: 0;
                    }

                    20% {
                        opacity: 0;
                    }

                    100% {
                        opacity: 1;
                    }
                }
            </style>
        </defs>
        <path fill="var(--alt-primary)" style="animation: fade3 1s ease-out" d="M277.94,203.47,0,277.94l28.85-50L216,177.82,160.46,81.6l-47,81.47L57.69,178,160.46,0Z" />
        <polygon fill="var(--header-profile-text)" style="animation: fade2 1s ease-out" points="277.95 203.47 216.02 177.82 160.47 81.6 113.44 163.07 57.7 178.01 160.47 0 277.95 203.47" />
        <polygon fill="var(--header-profile-text)" style="animation: fade1 1s ease-out" points="160.46 0 160.46 81.6 113.43 163.07 57.69 178.01 160.46 0" />
    </svg>
{:else}
    <img id="profile-picture-img" class="wtfbro no-drag" src="https://cdn.discordapp.com/attachments/731985411039166495/942461995410657370/womangetshitbyatruckkun.gif" alt="" />
{/if}

<style>
    .wtfbro {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    svg {
        transform: scale(0.6);
    }
</style>
