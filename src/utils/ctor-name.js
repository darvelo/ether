export default function ctorName(obj) {
    return Object.getPrototypeOf(obj).constructor.name;
}
