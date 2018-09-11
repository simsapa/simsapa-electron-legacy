module Model exposing (Model, init)

import Browser.Navigation as Nav
import Material
import Msg exposing (Msg(..))
import Url



--import Route
--, history : List (Maybe Route)


type alias Model =
    { mdc : Material.Model Msg
    , key : Nav.Key
    , url : Url.Url
    , lookupWord : Maybe String
    }


init : () -> Url.Url -> Nav.Key -> ( Model, Cmd Msg )
init flags url key =
    ( initialModel url key, Cmd.batch [ Material.init Mdc ] )


initialModel : Url.Url -> Nav.Key -> Model
initialModel url key =
    { mdc = Material.defaultModel
    , key = key
    , url = url
    , lookupWord = Nothing
    }
