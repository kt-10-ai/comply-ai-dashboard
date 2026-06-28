from sqlalchemy import Column, Integer, String
from database import Base

class NBFC(Base):
    __tablename__ = "nbfc_registry"
    id = Column(Integer, primary_key=True, index=True)
    sl_no = Column(Integer)
    nbfc_name = Column(String, index=True)
    regional_office = Column(String, index=True)
    accepts_deposits = Column(String)
    classification = Column(String, index=True)
    cin = Column(String, index=True)
    layer = Column(String, index=True)