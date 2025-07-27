export default function AppBar() {
    return (
    <div className="bg-black border border-white  p-4 flex justify-between items-center mt-7 rounded-3xl mx-auto w-3xl">
        <div className="font-bold text-xl bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">
            CoSync
        </div>
        <div className="flex space-x-4 ">
            <a href='' className="text-white hover:text-blue-400" >Features</a>
            <a href='#' className="text-white hover:text-blue-400">Pricing </a>
            <a href='%' className="text-white hover:text-blue-400">About</a>
        </div>

    </div>);
        
    
}