module Subscriptions exposing (subscriptions)

import Material
import Model exposing (Model)
import Msg exposing (Msg(..))


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch [ Material.subscriptions Mdc model ]

