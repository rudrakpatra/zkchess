import toast from "svelte-french-toast";
import ToastModalRenderable, { type ToastModalProps } from "./Renderable.svelte";
export const toastModal = (props:ToastModalProps)=>{
    toast(ToastModalRenderable,{props,duration:Infinity} as any)
}