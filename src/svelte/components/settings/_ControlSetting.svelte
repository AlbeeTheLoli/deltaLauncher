<script lang='ts'>
    import { global } from "../../src/global";  

    export let display_name: string;
    export let key: {
        minecraft_key: string,
        minecraft_code: number,
        key_code: number,
        key_name: string,
    };

    function ASCIItoLWJGL(kbPos: number) {
        switch (kbPos) {
            case 27:
                return 1; /* ESCAPE */

            case 49:
                return 2; /* NUMBER: 1 */

            case 50:
                return 3; /* NUMBER: 2 */

            case 51:
                return 4; /* NUMBER: 3 */

            case 52:
                return 5; /* NUMBER: 4 */

            case 53:
                return 6; /* NUMBER: 5 */

            case 54:
                return 7; /* NUMBER: 6 */

            case 55:
                return 8; /* NUMBER: 7 */

            case 56:
                return 9; /* NUMBER: 8 */

            case 57:
                return 10; /* NUMBER: 9 */

            case 58:
                return 11; /* NUMBER: 0 */

            case 189:
                return 12; /* MINUS */

            case 187:
                return 13; /* EQUALS */

            case 8:
                return 14; /* BACKSPACE */

            case 9:
                return 15; /* TAB */

            case 81:
                return 16; /* Q */

            case 87:
                return 17; /* W */

            case 69:
                return 18; /* E */

            case 82:
                return 19; /* R */

            case 84:
                return 20; /* T */

            case 89:
                return 21; /* Y */

            case 85:
                return 22; /* U */

            case 73:
                return 23; /* I */

            case 79:
                return 24; /* O */

            case 80:
                return 25; /* P */

            case 219:
                return 26; /* LBRACKET */

            case 221:
                return 27; /* RBRACKET */

            case 13:
                return 28; /* RETURN */

            case 17:
                return 29; /* LCONTROL */

            case 65:
                return 30; /* A */

            case 83:
                return 31; /* S */

            case 68:
                return 32; /* D */

            case 70:
                return 33; /* F */

            case 71:
                return 34; /* G */

            case 72:
                return 35; /* H */

            case 74:
                return 36; /* J */

            case 75:
                return 37; /* K */

            case 76:
                return 38; /* L */

            case 186:
                return 39; /* SEMICOLON */

            case 222:
                return 40; /* APOSTROPHE */

            case 96:
                return 41; /* GRAVE */

            case 16:
                return 42; /* LSHIFT */

            case 220:
                return 43; /* BACKSLASH */

            case 90:
                return 44; /* Z */

            case 88:
                return 45; /* X */

            case 67:
                return 46; /* C */

            case 86:
                return 47; /* V */

            case 66:
                return 48; /* B */

            case 78:
                return 49; /* N */

            case 77:
                return 50; /* M */

            case 188:
                return 51; /* COMMA */

            case 190:
                return 52; /* PERIOD */

            case 191:
                return 53; /* SLASH */

            case 42:
                return 55; /* MULTIPLY */

            case 18:
                return 56; /* LMENU */

            case 32:
                return 57; /* SPACE */

            case 20:
                return 58; /* CAPITAL */

            case 112:
                return 59; /* F1 */

            case 113:
                return 60; /* F2 */

            case 114:
                return 61; /* F3 */

            case 115:
                return 62; /* F4 */

            case 116:
                return 63; /* F5 */

            case 117:
                return 64; /* F6 */

            case 118:
                return 65; /* F7 */

            case 119:
                return 66; /* F8 */

            case 120:
                return 67; /* F9 */

            case 121:
                return 68; /* F10 */

            case 144:
                return 69; /* NUMLOCK */

            case 145:
                return 70; /* SCROLL */

            case 45:
                return 74; /* SUBSTRACT */

            case 43:
                return 78; /* ADD */

            case 46:
                return 83; /* DECIMAL */

            case 122:
                return 87; /* F11 */

            case 123:
                return 88; /* F12 */

            case 94:
                return 144; /* CIRCUMFLEX */

            case 64:
                return 145; /* AT */

            case 58:
                return 146; /* COLON */

            case 95:
                return 147; /* UNDERLINE */

            default:
                return 0; /* NONE */
        }
    }

    function onclick() {
        global.overlay.show('Нажмите любую клавишу...', key.key_name)

        let input = document.createElement('input');
        input.classList.add('invisible');
        document.getElementById('overlay-thing').appendChild(input)
        input.focus();
        input.onblur = () => {
            global.overlay.hide();
            input.remove();
        }

        input.onkeydown = e => {
            let name = e.key.toUpperCase();
            let code = e.keyCode;

            if (name == 'ESCAPE') {
                code = -1;
                name = 'NONE';
            } else if (name == 'CONTROL') {
                name = 'LCTRL';
            } else if (name == ' ') {
                name = 'SPACE';
            } else if (name == 'SHIFT') {
                name = 'LSHIFT';
            }

            console.log(code);

            key.key_code = code;
            key.minecraft_code = ASCIItoLWJGL(code);
            key.key_name = name;

            key = key;

            global.overlay.hide();
        }
    }
</script>

<div class="k-v-pair noselect">
    <p class="k">{display_name}</p>
    <p id="key-crouch" class="v" on:click={onclick}>{key.key_name}</p>
</div>

<style>
    .k-v-pair {
        cursor: pointer;
        display: flex;
        padding: 5px 0;
    }

    .k {
        font-size: 14px;
        font-weight: 700;
        width: 106px;
        opacity: .64;
    }

    .k-v-pair:hover .k {
        opacity: 1;
    }

    .v {
        font-size: 14px;
        font-weight: 700;
        width: 96px;
        opacity: .48;

        transition: opacity .32s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
</style>