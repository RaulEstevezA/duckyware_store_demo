# file to update product categories

from .models import Motherboard, CPU, GraphicsCard, RAM, ComputerCase, PowerSupply, CPUAirCooler, CPULiquidCooler, CaseFan, SoundCard, HardDrive, SSD, Monitor, Keyboard, Headset, Mouse, WebCam

# List of all product models
PRODUCT_MODELS = [
    Motherboard, CPU, GraphicsCard, RAM, ComputerCase, PowerSupply,
    CPUAirCooler, CPULiquidCooler, CaseFan, SoundCard, HardDrive,
    SSD, Monitor, Keyboard, Headset, Mouse, WebCam
]

# Dictionary to map category names to models
# Each key must be exactly the Category.name stored in the database (including spaces),
# otherwise the product page, cart and wishlist cannot find the product model
CATEGORY_TO_MODEL = {
    'Motherboards': Motherboard,
    'CPUs': CPU,
    'Graphics Cards': GraphicsCard,
    'RAM': RAM,
    'Computer Cases': ComputerCase,
    'Power Supplies': PowerSupply,
    'CPU Air Cooler': CPUAirCooler,
    'CPU Liquid Cooler': CPULiquidCooler,
    'Case Fans': CaseFan,
    'Sound Card': SoundCard,
    'Hard Drive': HardDrive,
    'SSD': SSD,
    'Monitors': Monitor,
    'Keyboards': Keyboard,
    'Headsets': Headset,
    'Mouses': Mouse,
    'Web Cams': WebCam
}
