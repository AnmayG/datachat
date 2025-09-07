from algopy import ARC4Contract, Global, Txn, Bytes, BoxMap, UInt64, log, subroutine
from algopy.arc4 import abimethod, Address, DynamicArray, DynamicBytes, UInt64 as AUInt64, Struct

# Module-level constants must be plain literals
HANDSHAKE_WINDOW_SECS = 60

class Pending(Struct):
    other: Address
    loc_hash: DynamicBytes
    ts: AUInt64  # unix seconds (ARC-4)

class HandshakeApp(ARC4Contract):
    """
    Boxes (per user):
      - b"c:" + addr -> DynamicArray[Address]
      - b"p:" + addr -> Pending
    """
    def __init__(self) -> None:
        self.connections = BoxMap(Bytes, DynamicArray[Address], key_prefix=b"c:")
        self.pending = BoxMap(Bytes, Pending, key_prefix=b"p:")

    # -------- helpers --------
    @subroutine
    def _contains(self, arr: DynamicArray[Address], who: Address) -> bool:
        i = UInt64(0)
        n = arr.length
        while i < n:
            if arr[i] == who:
                return True
            i = i + UInt64(1)
        return False

    @subroutine
    def _abs_diff(self, a: UInt64, b: UInt64) -> UInt64:
        return a - b if a >= b else b - a

    # -------- methods --------
    @abimethod()
    def request_handshake(self, other: Address, loc_hash: DynamicBytes) -> bool:
        # disallow self-handshake
        assert other.bytes != Txn.sender.bytes, "cannot handshake with self"

        me_key = Txn.sender.bytes
        other_key = other.bytes
        now = Global.latest_timestamp  # algopy.UInt64
        log("now", now)

        # If the other user has a pending request aimed at me, try to complete.
        if other_key in self.pending:
            pend = self.pending[other_key].copy()  # copy when taking to local
            if pend.other == Address(Txn.sender) and pend.loc_hash.bytes == loc_hash.bytes:
                if self._abs_diff(now, pend.ts.native) <= UInt64(HANDSHAKE_WINDOW_SECS):
                    me_list = (
                        self.connections[me_key].copy()
                        if me_key in self.connections else DynamicArray[Address]()
                    )
                    other_list = (
                        self.connections[other_key].copy()
                        if other_key in self.connections else DynamicArray[Address]()
                    )

                    if not self._contains(me_list, other):
                        me_list.append(other)
                    me_addr = Address(Txn.sender)
                    if not self._contains(other_list, me_addr):
                        other_list.append(me_addr)

                    # write back copies
                    self.connections[me_key] = me_list.copy()
                    self.connections[other_key] = other_list.copy()

                    del self.pending[other_key]
                    return True

        # Otherwise, (re)record my pending request (copy mutable arg)
        self.pending[me_key] = Pending(
            other=other,
            loc_hash=loc_hash.copy(),
            ts=AUInt64(now)
        )
        return False

    @abimethod()
    def get_my_connections(self) -> DynamicArray[Address]:
        me_key = Txn.sender.bytes
        return (
            self.connections[me_key].copy()
            if me_key in self.connections else DynamicArray[Address]()
        )