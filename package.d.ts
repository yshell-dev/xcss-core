export function RunCommand(args: string[]): Promise<void>;
export function GetMetadata(): { 
    DevMode: Boolean,
    binPath: string,
    Package: string,
};