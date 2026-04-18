import { Button } from '@/components/ui/button'

export function MaintenanceError() {
    return (
        <div className='h-svh'>
            <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
                <h1 className='text-[7rem] leading-tight font-bold'>503</h1>
                <span className='font-medium'>Website đang được bảo trì!</span>
                <p className='text-muted-foreground text-center'>
                    Trang web hiện không khả dụng. <br />
                    Chúng tôi sẽ sớm trở lại trực tuyến.
                </p>
                <div className='mt-6 flex gap-4'>
                    <Button variant='outline'>Tìm hiểu thêm</Button>
                </div>
            </div>
        </div>
    )
}