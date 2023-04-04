
export default class JayState {
    static controlScheme = 1;
    static keys = {};
    static leftMouseDown = false;
    static rightMouseDown = false;

    static renderer = null;
    static camera = null;
    static pointerControls = null;
    static orbitControls = null;    
    
    static {
        console.log("State initialized.");
    }
}
